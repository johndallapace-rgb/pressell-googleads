import { kv } from '@/lib/server/storage';
import { kvMonitor } from '@/lib/server/kv-monitor';
import { serverLogger as logger } from '@/lib/server/logger';

// --- CONFIGURATION ---
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // Keep stale data for 24 hours
const CIRCUIT_FAILURE_THRESHOLD = 5; // Failures before opening circuit
const CIRCUIT_COOLDOWN_MS = 30000; // 30 seconds cooldown
const MAX_CACHE_SIZE = 500; // STRICT LIMIT: Max items in memory (reduced from 1000)

// --- TYPES ---
interface CacheEntry<T> {
  value: T;
  expiry: number; // When to fetch fresh
  hardExpiry: number; // When to drop completely
}

interface CircuitState {
  status: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure: number;
}

// --- STATE ---
// Persistent across function invocations in same container
const memoryCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>(); // In-flight deduplication

const circuit: CircuitState = {
  status: 'closed',
  failures: 0,
  lastFailure: 0
};

// --- HELPERS ---
function isCircuitOpen(): boolean {
  if (circuit.status === 'closed') return false;
  
  const now = Date.now();
  if (circuit.status === 'open') {
    if (now - circuit.lastFailure > CIRCUIT_COOLDOWN_MS) {
      circuit.status = 'half-open'; // Allow one probe
      return false;
    }
    return true;
  }
  
  return false; // Half-open allows traffic
}

function recordSuccess() {
  if (circuit.status !== 'closed') {
    circuit.status = 'closed';
    circuit.failures = 0;
    kvMonitor.trackCircuitReset();
  }
}

function recordFailure() {
  circuit.failures++;
  circuit.lastFailure = Date.now();
  
  if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD && circuit.status === 'closed') {
    circuit.status = 'open';
    kvMonitor.trackCircuitTrip();
  } else if (circuit.status === 'half-open') {
    circuit.status = 'open'; // Re-open immediately on failure
  }
}

function enforceCacheLimit() {
  if (memoryCache.size > MAX_CACHE_SIZE) {
    // Simple eviction: remove oldest 20%
    // Map iterates in insertion order, so keys() gives oldest first
    let removed = 0;
    const limit = Math.floor(MAX_CACHE_SIZE * 0.2);
    for (const key of memoryCache.keys()) {
        memoryCache.delete(key);
        removed++;
        if (removed >= limit) break;
    }
  }
}

/**
 * PRODUCTION-GRADE KV CACHE
 * Features: Memory Layer, TTL, Stale-While-Revalidate, Circuit Breaker, Deduplication, Bounded Memory
 */
export const kvCache = {
  
  /**
   * GET with Stale-While-Revalidate
   */
  async get<T>(
    key: string, 
    context: string = 'default',
    ttl: number = DEFAULT_TTL_MS
  ): Promise<T | null> {
    const now = Date.now();
    const cached = memoryCache.get(key);

    // 1. MEMORY HIT (FRESH)
    if (cached && cached.expiry > now) {
      kvMonitor.trackRead(true, false);
      return cached.value as T;
    }

    // 2. CIRCUIT BREAKER / FALLBACK
    // If circuit is open, return stale data if available, else null (fail safe)
    if (isCircuitOpen()) {
      if (cached && cached.hardExpiry > now) {
        kvMonitor.trackRead(true, true);
        return cached.value as T;
      }
      logger.warn('storage', 'KV_CIRCUIT_BLOCK', `Blocked read for ${key}`, { context });
      return null; // Safe fallback
    }

    // 3. MEMORY HIT (STALE) - STALE-WHILE-REVALIDATE
    if (cached && cached.hardExpiry > now) {
      // Trigger background refresh
      // We don't await this!
      this.refresh(key, ttl, context).catch(e => {
        logger.warn('storage', 'KV_SWR_ERROR', `Background refresh failed for ${key}`, { error: e.message });
      });
      
      kvMonitor.trackRead(true, true);
      return cached.value as T;
    }

    // 4. CACHE MISS / HARD EXPIRED -> FETCH
    // Use request deduplication
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key) as Promise<T | null>;
    }

    const promise = (async () => {
      try {
        if (!kv) return null;
        
        const val = await kv.get<T>(key);
        
        if (val !== null) {
          this.setMemory(key, val, ttl);
          recordSuccess();
        }
        
        kvMonitor.trackRead(false, false);
        return val;
      } catch (error: any) {
        recordFailure();
        kvMonitor.trackError(error, context);
        
        // If fetch fails, try to return stale one last time even if hard expired
        if (cached) return cached.value as T;
        
        return null;
      } finally {
        pendingRequests.delete(key);
      }
    })();

    pendingRequests.set(key, promise);
    return promise;
  },

  /**
   * SET with Cache Update
   */
  async set<T>(
    key: string, 
    value: T, 
    context: string = 'default',
    ttl: number = DEFAULT_TTL_MS
  ): Promise<boolean> {
    try {
      // Optimistic update
      this.setMemory(key, value, ttl);
      kvMonitor.trackWrite();

      if (!kv || isCircuitOpen()) {
        // If Redis is dead, we rely on memory cache (write-through-ish)
        logger.warn('storage', 'KV_WRITE_MEMORY_ONLY', `Redis unavailable, wrote to memory only: ${key}`);
        return true; 
      }

      await kv.set(key, value);
      recordSuccess();
      return true;
    } catch (error: any) {
      recordFailure();
      kvMonitor.trackError(error, `write:${context}`);
      return false;
    }
  },

  /**
   * Delete
   */
  async del(key: string): Promise<boolean> {
    memoryCache.delete(key);
    try {
      if (kv && !isCircuitOpen()) {
        await kv.del(key);
        recordSuccess();
      }
      return true;
    } catch (error: any) {
      recordFailure();
      return false;
    }
  },

  /**
   * Internal Refresh for SWR
   */
  async refresh<T>(key: string, ttl: number, context: string) {
    if (!kv || isCircuitOpen()) return;
    
    // Dedupe refresh too
    if (pendingRequests.has(key)) return;

    const promise = (async () => {
      try {
        const val = await kv.get<T>(key);
        if (val !== null) {
          this.setMemory(key, val, ttl);
          recordSuccess();
        }
      } catch (error: any) {
        recordFailure();
        kvMonitor.trackError(error, `refresh:${context}`);
      } finally {
        pendingRequests.delete(key);
      }
    })();

    pendingRequests.set(key, promise);
    await promise;
  },

  setMemory<T>(key: string, value: T, ttl: number) {
    const now = Date.now();
    
    // Check size limit before adding
    if (memoryCache.size >= MAX_CACHE_SIZE && !memoryCache.has(key)) {
        enforceCacheLimit();
    }

    memoryCache.set(key, {
      value,
      expiry: now + ttl,
      hardExpiry: now + STALE_TTL_MS
    });
  },

  clearMemory() {
    memoryCache.clear();
  },

  getStats() {
    return {
      keys: memoryCache.size,
      circuit: circuit.status,
      failures: circuit.failures
    };
  }
};
