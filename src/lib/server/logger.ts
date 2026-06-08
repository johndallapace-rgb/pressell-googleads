import 'server-only';
import { LogLevel, LogModule, LogEntry, LogContext } from '@/lib/shared/log-types';

// Detect Runtime
const isEdge = typeof EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';

// We need to dynamically import fs/path ONLY in Node runtime to avoid Edge build errors.
// Top-level imports of 'fs' break Edge builds even if guarded by if statements at runtime.
// Solution: Use a lazy require pattern or conditional imports if bundler supports it.
// Next.js Edge Runtime is very strict.
// Best approach: This file (logger.ts) should NOT be imported by Edge routes at all.
// But if it is accidentally imported, we must ensure it doesn't crash.

let fs: any;
let path: any;

if (!isEdge) {
    try {
        fs = require('fs');
        path = require('path');
    } catch (e) {}
}

// Configuration
let LOG_DIR = '/tmp/logs'; 
try {
    if (!isEdge && fs && path) {
        LOG_DIR = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    }
} catch (e) {
    // console.error('Failed to create log directory:', e);
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'auth', 'cookie', 'authorization'];

function sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) {
            cleaned[k] = '[REDACTED]';
        } else if (typeof v === 'object') {
            cleaned[k] = sanitize(v);
        } else {
            cleaned[k] = v;
        }
    }
    return cleaned;
}

function writeToFile(filename: string, entry: LogEntry) {
    if (isEdge || !fs || !path) return; // Skip file write on Edge or if modules missing
    try {
        const filepath = path.join(LOG_DIR, filename);
        const line = JSON.stringify(entry) + '\n';
        fs.appendFileSync(filepath, line);
    } catch (e) {
        // Fail silently
    }
}

class ServerLogger {
    private log(level: LogLevel, module: LogModule, event: string, message: string, context?: LogContext) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            module,
            event,
            message,
            context: sanitize(context || {})
        };

        // 1. Console Output (Standardized)
        const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
        consoleMethod(`[${level}][${module}][${event}] ${message}`, entry.context);

        // 2. File Output (Node Only)
        if (!isEdge && fs && path) {
            writeToFile(`${module}.log`, entry);
            writeToFile('all-events.log', entry);
            if (level === 'ERROR') writeToFile('errors.log', entry);
            if (module === 'audit' || event.includes('CREATED') || event.includes('UPDATED') || event.includes('DELETED')) {
                writeToFile('audit.log', entry);
            }
        }
    }

    info(module: LogModule, event: string, message: string, context?: LogContext) {
        this.log('INFO', module, event, message, context);
    }

    warn(module: LogModule, event: string, message: string, context?: LogContext) {
        this.log('WARN', module, event, message, context);
    }

    error(module: LogModule, event: string, message: string, context?: LogContext) {
        this.log('ERROR', module, event, message, context);
    }

    debug(module: LogModule, event: string, message: string, context?: LogContext) {
        this.log('DEBUG', module, event, message, context);
    }
    
    audit(module: LogModule, action: string, message: string, context?: LogContext) {
        this.log('INFO', 'audit', 'AUDIT_CHANGE', message, {
            targetModule: module,
            action,
            ...context
        });
    }
}

export const serverLogger = new ServerLogger();
