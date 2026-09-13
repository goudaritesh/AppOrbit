import { Router } from 'express';
import {
  submitFeedback,
  getAdminFeedbacks,
  updateFeedback,
  upvoteFeedback,
} from '../controllers/feedbackController.js';
import { protect, optionalAuth, authorizeRoles } from '../middleware/authMiddleware.js';
import { reviewRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Public / Authenticated Feedback Submission (Rate-Protected)
router.post('/', optionalAuth, reviewRateLimiter, submitFeedback);
router.post('/:id/upvote', optionalAuth, upvoteFeedback);

// Administrative Feedback Management
router.get('/', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getAdminFeedbacks);
router.patch('/:id', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateFeedback);

export default router;
