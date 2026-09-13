import { Router } from 'express';
import {
  getMyReferralCode,
  getMyReferrals,
  validateInviteCode,
  getAdminReferrals,
} from '../controllers/referralController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public Invite Code Validation (e.g. at registration or landing)
router.post('/validate', validateInviteCode);

// Authenticated User / Developer Referral Actions
router.get('/code', protect, getMyReferralCode);
router.get('/me', protect, getMyReferrals);

// Admin Referral Oversight
router.get('/admin', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getAdminReferrals);

export default router;
