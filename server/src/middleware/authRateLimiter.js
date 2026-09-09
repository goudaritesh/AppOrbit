import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for sensitive authentication endpoints (login, signup, password reset).
 * Thwarts brute-force attacks and credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export default authRateLimiter;
