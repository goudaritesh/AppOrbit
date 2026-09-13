import { Router } from 'express';
import { submitBug, getAdminBugs, updateBug } from '../controllers/bugController.js';
import { protect, optionalAuth, authorizeRoles } from '../middleware/authMiddleware.js';
import { reviewRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Public / Authenticated Bug Submission (Rate-Protected)
router.post('/', optionalAuth, reviewRateLimiter, submitBug);

// Administrative Bug Tracking & Management
router.get('/', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getAdminBugs);
router.patch('/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateBug);

export default router;
