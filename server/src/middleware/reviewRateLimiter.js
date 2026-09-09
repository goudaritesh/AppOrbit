import rateLimit from 'express-rate-limit';

/**
 * Review Anti-Spam Rate Limiter (Sprint 7 Requirement 16)
 * Limits review submissions to 5 per hour per user/IP.
 */
export const reviewRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_REVIEW_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_REVIEW_MAX, 10) || 5, // 5 reviews per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many review submissions. Maximum 5 reviews allowed per hour.',
  },
  keyGenerator: (req) => {
    return req.user?._id ? req.user._id.toString() : (req.ip || 'unknown');
  },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1');
  },
});

export default reviewRateLimiter;
