import rateLimit from 'express-rate-limit';

/**
 * Sprint 11 Dedicated Rate Limiting Middleware Suite
 * Provides defense-in-depth protection against credential stuffing,
 * registration bot spam, fake reviews, repeated download abuse, and API flooding.
 */

// Helper to check if tests or local health checks should bypass
const shouldSkip = (req) => {
  if (process.env.NODE_ENV === 'test') return true;
  const ip = req.ip || req.connection?.remoteAddress || '';
  // Don't rate limit automated local health ping requests
  if (req.originalUrl === '/api/v1/health' && (ip === '127.0.0.1' || ip === '::1')) {
    return true;
  }
  return false;
};

/**
 * 1. Login Rate Limiter: 5 attempts per 15 minutes
 * Thwarts brute force credential cracking.
 */
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_LOGIN_ATTEMPTS',
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
  skip: shouldSkip,
});

/**
 * 2. Registration Rate Limiter: 5 requests per hour
 * Mitigates sybil accounts, automated bot creation, and verification email flooding.
 */
export const registerRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_SIGNUP_MAX, 10) || 5, // 5 signups per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    message: 'Too many account registrations from this IP address. Please try again later.',
  },
  skip: shouldSkip,
});

/**
 * 3. Review Rate Limiter: 10 requests per hour
 * Prevents review bombing, automated star manipulation, and spamming.
 */
export const reviewRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_REVIEW_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_REVIEW_MAX, 10) || 10, // 10 reviews per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'REVIEW_RATE_LIMIT_EXCEEDED',
    message: 'Too many reviews posted recently. Please try again in an hour.',
  },
  skip: shouldSkip,
});

/**
 * 4. APK Download Rate Limiter: 30 requests per hour per IP
 * Protects bandwidth, limits CDN abuse, and mitigates automated scraping.
 */
export const downloadRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_DOWNLOAD_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_DOWNLOAD_MAX, 10) || 30, // 30 downloads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'DOWNLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Too many download requests initiated from this IP. Please wait before downloading more APKs.',
  },
  skip: shouldSkip,
});

/**
 * 5. General API Rate Limiter: 1000 requests per 15 minutes
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP. Please slow down.',
  },
  skip: shouldSkip,
});

export default {
  loginRateLimiter,
  registerRateLimiter,
  reviewRateLimiter,
  downloadRateLimiter,
  apiRateLimiter,
};
