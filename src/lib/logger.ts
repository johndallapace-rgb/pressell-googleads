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

const LOG_DIR = (typeof process !== 'undefined' && process.cwd) ? path.resolve(process.cwd(), 'logs') : '';

// Ensure log directory exists (Sync is fine for init)
try {
    if (typeof window === 'undefined' && fs && !fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (e) {
    console.error('[Logger] Failed to create log directory', e);
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
    // Skip if not in Node environment (Vercel Edge or Browser)
    if (typeof window !== 'undefined' || typeof process === 'undefined' || !fs) return;
    
    // Vercel Detection
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Safety Check:
    // If we are in Vercel Production, we MUST NOT write to FS (ReadOnly / Ephemeral).
    // If we are in Local Production (npm run start), we CAN write.
    // If we are in Local Dev (npm run dev), we CAN write.
    
    if (isVercel) return;

    // For local dev/prod, we proceed.
    // Note: We already checked for `fs` presence above.
    
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
            if (err) console.error('[Logger] Write failed:', err);
        });

    } catch (e) {
        console.error('[Logger] Unexpected error:', e);
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
