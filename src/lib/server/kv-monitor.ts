import { kv } from '@/lib/server/storage';
import { serverLogger as logger } from '@/lib/server/logger';
import { isSnapshotLoaded, isDurableSnapshotLoaded } from '@/lib/server/config';

// --- TYPES ---
export interface MonitorStats {
  reads: number;
  writes: number;
  hits: number;
  misses: number;
  staleServed: number;
  errors: number;
  circuitBreakerTrips: number;
  lastErrorAt: string | null;
  lastRefreshAt: string | null;
  status: 'healthy' | 'degraded' | 'critical';
  usingSnapshot: boolean;
  usingDurableSnapshot: boolean;
}

// --- STATE ---
const stats: MonitorStats = {
  reads: 0,
  writes: 0,
  hits: 0,
  misses: 0,
  staleServed: 0,
  errors: 0,
  circuitBreakerTrips: 0,
  lastErrorAt: null,
  lastRefreshAt: new Date().toISOString(),
  status: 'healthy',
  usingSnapshot: false,
  usingDurableSnapshot: false
};

const ERROR_WINDOW_MS = 60000; // 1 minute
let recentErrors: number[] = [];

/**
 * KV Monitor & Telemetry
 * Tracks usage and health of the data layer.
 */
export const kvMonitor = {
  trackRead(hit: boolean, stale: boolean = false) {
    stats.reads++;
    if (hit) stats.hits++;
    else stats.misses++;
    if (stale) stats.staleServed++;
  },

  trackWrite() {
    stats.writes++;
  },

  trackError(error: any, context?: string) {
    stats.errors++;
    stats.lastErrorAt = new Date().toISOString();
    
    const now = Date.now();
    recentErrors.push(now);
    recentErrors = recentErrors.filter(t => t > now - ERROR_WINDOW_MS);

    // Update status based on error rate
    if (recentErrors.length > 50) {
        stats.status = 'critical';
    } else if (recentErrors.length > 10) {
        stats.status = 'degraded';
    }

    logger.error('storage', 'KV_OP_ERROR', error?.message || 'Unknown Redis Error', { 
        context,
        recentErrorCount: recentErrors.length 
    });
  },

  trackCircuitTrip() {
    stats.circuitBreakerTrips++;
    stats.status = 'critical';
    logger.warn('storage', 'KV_CIRCUIT_TRIPPED', 'Circuit breaker opened due to high failure rate');
  },

  trackCircuitReset() {
    stats.status = 'degraded'; // Reset to degraded first
    logger.info('storage', 'KV_CIRCUIT_RESET', 'Circuit breaker closed, resuming normal operations');
  },

  getStats(): MonitorStats {
    // Add memory usage estimate (approximate)
    // Node.js memoryUsage() is available in server environment
    // Use optional chaining and type check for Edge compatibility
    let memUsage = 0;
    try {
        // Safe check for process.memoryUsage which is Node-only
        if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
            memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        }
    } catch (e) {}
    
    return { 
        ...stats,
        usingSnapshot: isSnapshotLoaded(),
        usingDurableSnapshot: isDurableSnapshotLoaded(),
        // @ts-ignore - adding ad-hoc field for now or extend interface
        memoryUsageMB: memUsage
    };
  },

  /**
   * Safe Health Check (No dangerous ops)
   */
  async checkHealth() {
    // If we are using snapshot fallback, we might report degraded instead of disconnected
    if (!kv) return { status: 'disconnected', message: 'KV not configured' };
    
    try {
        const start = Date.now();
        await kv.ping();
        return { 
            status: stats.status === 'critical' ? 'degraded' : 'healthy', 
            latency: Date.now() - start 
        };
    } catch (e: any) {
        return { status: 'unreachable', error: e.message };
    }
  }
};
