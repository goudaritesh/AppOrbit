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
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/authRateLimiter.js';
import {
  validate,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from '../validators/authValidator.js';

const router = Router();

// Public Authentication Endpoints
router.post('/signup', authRateLimiter, validate(signupValidation), signup);
router.post('/register', authRateLimiter, validate(signupValidation), signup);
router.post('/login', authRateLimiter, validate(loginValidation), login);
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
router.post('/resend-verification', authRateLimiter, resendVerification);

// Authenticated Profile Endpoints
router.get('/me', protect, getMe);
router.patch('/profile', protect, validate(updateProfileValidation), updateProfile);

export default router;
