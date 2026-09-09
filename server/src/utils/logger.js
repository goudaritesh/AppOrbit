/**
 * AppOrbit Production Structured Logger (Phase 10)
 * Provides leveled logging, JSON serialization in production, request ID correlation,
 * and automatic credential redaction (passwords, JWTs, secrets, API keys).
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshtoken',
  'accesstoken',
  'jwt',
  'secret',
  'jwt_secret',
  'razorpay_key_secret',
  'razorpay_webhook_secret',
  'apikey',
  'authorization',
  'cookie',
  'cookies',
]);

const currentLevelName = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG')).toUpperCase();
const currentLevel = LOG_LEVELS[currentLevelName] !== undefined ? LOG_LEVELS[currentLevelName] : LOG_LEVELS.INFO;
const isJsonOutput = process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json';

/**
 * Recursively redacts sensitive keys from metadata objects.
 */
function redact(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password')) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = redact(value, depth + 1);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function formatLog(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const safeMeta = redact(metadata);

  if (isJsonOutput) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...safeMeta,
    });
  }

  const colorCodes = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  const color = colorCodes[level] || reset;
  const metaStr = Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : '';

  return `${color}[${timestamp}] [${level}]${reset} ${message}${metaStr}`;
}

export const logger = {
  debug: (message, meta) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, meta));
    }
  },
  info: (message, meta) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, meta));
    }
  },
  warn: (message, meta) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta));
    }
  },
  error: (message, meta) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta));
    }
  },
  redact,
};

export default logger;
