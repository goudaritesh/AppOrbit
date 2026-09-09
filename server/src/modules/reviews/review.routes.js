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
} from './review.controller.js';
import { protect, optionalAuth, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

/* ==========================================
   DIRECT REVIEW ROUTES (/api/reviews)
   ========================================== */

// Edit review
router.put('/:reviewId', protect, updateReview);

// Delete review (soft delete)
router.delete('/:reviewId', protect, deleteReview);

// Helpful voting
router.post('/:reviewId/helpful', protect, voteHelpful);
router.delete('/:reviewId/helpful', protect, unvoteHelpful);

// Abuse reporting
router.post('/:reviewId/report', protect, reportReview);

// Developer response
router.post('/:reviewId/reply', protect, authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'), developerReply);

export default router;

/* ==========================================
   APP-NESTED REVIEW ROUTES HELPER
   ========================================== */
export const appReviewRouter = Router({ mergeParams: true });

appReviewRouter.post('/', protect, createReview);
appReviewRouter.get('/', optionalAuth, getAppReviews);
