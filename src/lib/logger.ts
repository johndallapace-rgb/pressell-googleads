import path from 'path';

/**
 * Trae Local Logger
 * 
 * Purpose: Provide persistent structured logging for local debugging.
 * Location: ./logs/ (Project Root)
 * Format: JSON Lines (append-only)
 * 
 * Safety: 
 * - Only writes in Node.js environment (skips Edge/Browser)
 * - Sanitizes sensitive fields
 * - Rotates files weekly or by size check if needed (simple implementation here)
 */

let fs: any;
try {
    if (typeof window === 'undefined') {
        fs = require('fs');
    }
} catch (e) {
    // Ignore fs import error on client
}

const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';
const allowFileLogging = !isVercel && !isProduction; // ONLY allow in local dev? Or local prod too?
// User requirement: "Localhost/dev: may write logs to ./logs". "Vercel/production: must only log to console".
// User also said: "In localhost/dev only: optional file logging is allowed".
// And: "Use a guard like: const allowFileLogging = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;"

// Wait, earlier the user said "localhost can still log safely for debugging".
// If I run `npm run start` locally (production mode), do I want logs?
// The user said: "If we are in Local Production (npm run start), we CAN write." in my previous reasoning.
// But the NEW requirement says: "In localhost/dev only: optional file logging is allowed".
// And explicitly suggests: `process.env.NODE_ENV !== 'production' && !process.env.VERCEL`.
// This implies disabling logs in `npm run start` locally too?
// Let's stick to the EXPLICIT guard requested: `process.env.NODE_ENV !== 'production' && !process.env.VERCEL`.

const allowFileLogging = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

// Safe LOG_DIR initialization
// ABSOLUTELY NO process.cwd() at top level if not allowed
const LOG_DIR = (typeof process !== 'undefined' && process.cwd && allowFileLogging) 
    ? path.resolve(process.cwd(), 'logs') 
    : '';

// Ensure log directory exists (Sync is fine for init ONLY if allowed)
try {
    if (typeof window === 'undefined' && fs && allowFileLogging && LOG_DIR && !fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (e) {
    // Silent fail in production/vercel just in case
}

export type LogCategory = 
    | 'admin-actions'
    | 'save-product'
    | 'public-route'
    | 'checker'
    | 'self-heal'
    | 'repair'
    | 'global-scale'
    | 'errors'
    | 'system'
    | 'config';

export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
    event: string;
    source?: string;
    vertical?: string;
    slug?: string;
    key?: string;
    status?: string;
    reason?: string;
    message?: string;
    error?: string;
    host?: string;
    path?: string;
    [key: string]: any;
}

const SENSITIVE_KEYS = ['token', 'key', 'secret', 'password', 'cookie', 'auth', 'authorization'];

function sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(sanitize);
    }

    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
        const lowerK = k.toLowerCase();
        if (SENSITIVE_KEYS.some(sk => lowerK.includes(sk))) {
            cleaned[k] = '[REDACTED]';
        } else if (typeof v === 'object') {
            cleaned[k] = sanitize(v);
        } else {
            cleaned[k] = v;
        }
    }
    return cleaned;
}

function writeToFile(category: LogCategory, level: LogLevel, payload: LogPayload) {
    // 1. Guard against non-node
    if (typeof window !== 'undefined' || typeof process === 'undefined' || !fs) return;
    
    // 2. STRICTLY ENFORCE FILE LOGGING POLICY
    // Vercel/serverless uses a read-only filesystem, so file logging must remain disabled in production.
    if (!allowFileLogging || !LOG_DIR) return;

    try {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `${dateStr}-${category}.log`;
        const filePath = path.join(LOG_DIR, filename);

        const logEntry = {
            ts: date.toISOString(),
            level,
            category,
            ...sanitize(payload)
        };

        const line = JSON.stringify(logEntry) + '\n';
        
        fs.appendFile(filePath, line, (err: any) => {
            if (err) {
                // Fallback to console warning if local write fails (e.g. permission error)
                console.warn('[Logger] Local write failed:', err.message);
            }
        });

    } catch (e) {
        // Never throw
        console.warn('[Logger] Unexpected error:', e);
    }
}

export const logger = {
    info: (category: LogCategory, payload: LogPayload) => {
        // Always console log for visibility
        console.log(`[INFO][${category}]`, payload);
        writeToFile(category, 'info', payload);
    },
    warn: (category: LogCategory, payload: LogPayload) => {
        console.warn(`[WARN][${category}]`, payload);
        writeToFile(category, 'warn', payload);
    },
    error: (category: LogCategory, payload: LogPayload) => {
        console.error(`[ERROR][${category}]`, payload);
        writeToFile(category, 'error', payload);
    },
    
    // Helper to log save events specifically matching the requested format
    // event is optional here because we supply it
    save: (payload: Omit<LogPayload, 'event'>) => {
        console.log(`[SAVE]`, payload);
        writeToFile('save-product', 'info', { event: 'SAVE_PRODUCT', ...payload });
    },
    lock: (payload: Record<string, any>) => {
        // Locks are spammy, maybe skip console? No, debugging is active.
        // console.log(`[LOCK]`, payload); 
        writeToFile('save-product', 'info', { event: 'LOCK_EVENT', ...payload });
    }
};
