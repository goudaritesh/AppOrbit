import { Router } from 'express';
import {
  joinWaitlist,
  getWaitlist,
  getWaitlistSummary,
} from '../controllers/waitlistController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { registerRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Public Waitlist Registration (Rate-limited)
router.post('/', registerRateLimiter, joinWaitlist);

// Admin Waitlist Operations
router.get('/', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getWaitlist);
router.get('/summary', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getWaitlistSummary);

export default router;
