type LogCategory =
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

type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  event?: string;
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

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Vercel/serverless uses a read-only filesystem.
 * File logging must remain disabled in deployed environments.
 * Only allow file logging in local development.
 */
const allowFileLogging = !isVercel && isDevelopment;

const SENSITIVE_KEYS = [
  'token',
  'key',
  'secret',
  'password',
  'cookie',
  'auth',
  'authorization',
];

function sanitize(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lowerK = k.toLowerCase();

    if (SENSITIVE_KEYS.some((sk) => lowerK.includes(sk))) {
      cleaned[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      cleaned[k] = sanitize(v);
    } else {
      cleaned[k] = v;
    }
  }

  return cleaned;
}

function getFs() {
  if (!allowFileLogging || typeof window !== 'undefined') return null;

  try {
    // Require lazily so Edge/Vercel build does not evaluate fs at module load.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('fs') as typeof import('fs');
  } catch {
    return null;
  }
}

function getPath() {
  if (!allowFileLogging || typeof window !== 'undefined') return null;

  try {
    // Require lazily so Edge/Vercel build does not evaluate path at module load.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('path') as typeof import('path');
  } catch {
    return null;
  }
}

function getLogDir(): string | null {
  if (!allowFileLogging) return null;

  try {
    const path = getPath();
    if (!path) return null;
    return path.resolve('logs');
  } catch (e) {
    console.warn('[Logger] Failed to resolve log directory', e);
    return null;
  }
}

function ensureLogDir(): string | null {
  if (!allowFileLogging) return null;

  try {
    const fs = getFs();
    const dir = getLogDir();

    if (!fs || !dir) return null;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
  } catch (e) {
    console.warn('[Logger] Failed to create log directory', e);
    return null;
  }
}

function writeToFile(category: LogCategory, level: LogLevel, payload: LogPayload) {
  if (!allowFileLogging) return;

  try {
    const fs = getFs();
    const path = getPath();
    const dir = ensureLogDir();

    if (!fs || !path || !dir) return;

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const filename = `${dateStr}-${category}.log`;
    const filePath = path.join(dir, filename);

    const logEntry = {
      ts: date.toISOString(),
      level,
      category,
      ...sanitize(payload),
    };

    const line = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
  } catch (e: any) {
    console.warn('[Logger] Local write failed:', e?.message || e);
  }
}

function emit(level: LogLevel, category: LogCategory, payload: LogPayload) {
  const safePayload = sanitize(payload);

  if (level === 'error') {
    console.error(`[ERROR][${category}]`, safePayload);
  } else if (level === 'warn') {
    console.warn(`[WARN][${category}]`, safePayload);
  } else {
    console.log(`[INFO][${category}]`, safePayload);
  }

  writeToFile(category, level, safePayload);
}

export const logger = {
  info(category: LogCategory, payload: LogPayload) {
    emit('info', category, payload);
  },

  warn(category: LogCategory, payload: LogPayload) {
    emit('warn', category, payload);
  },

  error(category: LogCategory, payload: LogPayload) {
    emit('error', category, payload);
  },

  save(payload: Omit<LogPayload, 'event'>) {
    const safePayload = { event: 'SAVE_PRODUCT', ...payload };
    console.log('[SAVE]', sanitize(safePayload));
    writeToFile('save-product', 'info', safePayload);
  },

  lock(payload: Record<string, any>) {
    const safePayload = { event: 'LOCK_EVENT', ...payload };
    writeToFile('save-product', 'info', safePayload);
  },
};

export type { LogCategory, LogLevel, LogPayload };
