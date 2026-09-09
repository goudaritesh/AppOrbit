import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Request Correlation & Observability Middleware (Phase 10)
 * Generates or propagates unique request IDs across API logs, error traces, and client responses.
 */
export const requestCorrelation = (req, res, next) => {
  // Check incoming header or generate a cryptographically unique request ID
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(incomingId))
    ? incomingId
    : `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  req.id = requestId;
  req._startTime = Date.now();

  res.setHeader('X-Request-Id', requestId);

  // Log on request completion
  res.on('finish', () => {
    const duration = Date.now() - req._startTime;
    const isError = res.statusCode >= 400;

    let clientIp = '127.0.0.1';
    try {
      clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    } catch {
      clientIp = req.socket?.remoteAddress || '127.0.0.1';
    }

    const logMeta = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      ip: clientIp,
      userAgent: req.get('user-agent'),
    };

    if (isError) {
      logger.warn(`HTTP ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`, logMeta);
    } else {
      logger.info(`HTTP ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`, logMeta);
    }
  });

  next();
};

export default requestCorrelation;
