import { Router } from 'express';
import {
  createReview,
  getAppReviews,
  updateReview,
  deleteReview,
  voteHelpful,
  unvoteHelpful,
  reportReview,
  developerReply,
  getAdminReviews,
  moderateReview,
  getDeveloperReviews,
} from './review.controller.js';
import { protect, optionalAuth, authorizeRoles } from '../../middleware/authMiddleware.js';
import { reviewRateLimiter } from '../../middleware/rateLimitMiddleware.js';
import { createReviewValidation, replyReviewValidation } from '../../validators/reviewValidator.js';

const router = Router();

/* ==========================================
   DIRECT REVIEW ROUTES (/api/reviews)
   ========================================== */

// Developer reviews dashboard list
router.get('/developer', protect, authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'), getDeveloperReviews);
router.get('/developer/reviews', protect, authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'), getDeveloperReviews);

// Edit review (support both PATCH and PUT per Sprint 7 spec)
router.patch('/:reviewId', protect, updateReview);
router.put('/:reviewId', protect, updateReview);

// Delete review (soft delete)
router.delete('/:reviewId', protect, deleteReview);

// Helpful voting (Sprint 7 Requirement 9)
router.post('/:reviewId/helpful', protect, voteHelpful);
router.delete('/:reviewId/helpful', protect, unvoteHelpful);

// Abuse reporting (Sprint 7 Requirement 13)
router.post('/:reviewId/report', protect, reportReview);

// Developer response (support both /respond and /reply per Sprint 7 spec)
router.post('/:reviewId/respond', protect, authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'), replyReviewValidation, developerReply);
router.post('/:reviewId/reply', protect, authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'), replyReviewValidation, developerReply);

// Admin moderation shortcuts
router.patch('/:reviewId/status', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateReview);
router.patch('/:reviewId/moderate', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), moderateReview);

export default router;

/* ==========================================
   APP-NESTED REVIEW ROUTES HELPER
   ========================================== */
export const appReviewRouter = Router({ mergeParams: true });

appReviewRouter.post('/', protect, reviewRateLimiter, createReviewValidation, createReview);
appReviewRouter.get('/', optionalAuth, getAppReviews);
