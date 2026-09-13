import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  googleLogin,
  firebaseLogin,
  firebaseSignup,
  upgradeToTrial,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/authRateLimiter.js';
import {
  loginRateLimiter,
  registerRateLimiter,
} from '../middleware/rateLimitMiddleware.js';
import {
  validate,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from '../validators/authValidator.js';

const router = Router();

// Public Authentication Endpoints (Sprint 11 Rate-Hardened)
router.post('/signup', registerRateLimiter, validate(signupValidation), signup);
router.post('/register', registerRateLimiter, validate(signupValidation), signup);
router.post('/login', loginRateLimiter, validate(loginValidation), login);
router.post('/google', loginRateLimiter, googleLogin);
router.post('/firebase-login', loginRateLimiter, firebaseLogin);
router.post('/firebase-signup', registerRateLimiter, firebaseSignup);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// Password Recovery Flow
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordValidation),
  forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordValidation),
  resetPassword
);

// Email Verification Flow
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, authRateLimiter, resendVerification);

// Authenticated Profile Endpoints
router.get('/me', protect, getMe);
router.patch('/profile', protect, validate(updateProfileValidation), updateProfile);

// Upgrade to Developer Free Trial
router.post('/upgrade-trial', protect, upgradeToTrial);

export default router;
