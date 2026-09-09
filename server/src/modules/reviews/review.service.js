import mongoose from 'mongoose';
import Review from '../../models/Review.js';
import ReviewVote from '../../models/ReviewVote.js';
import ReviewReport from '../../models/ReviewReport.js';
import App from '../../models/App.js';
import DownloadEvent from '../../models/DownloadEvent.js';
import AuditLog from '../../models/AuditLog.js';

export class ReviewService {
  /**
   * Recalculates cached rating aggregates for an application safely.
   */
  static async recalculateAppRating(appId) {
    const objectId = new mongoose.Types.ObjectId(appId);

    const stats = await Review.aggregate([
      { $match: { application: objectId, status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]);

    let ratingAverage = 0;
    let ratingCount = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (stats.length > 0) {
      ratingCount = stats[0].count;
      ratingAverage = Math.round(stats[0].avgRating * 10) / 10;
      ratingDistribution = {
        1: stats[0].star1,
        2: stats[0].star2,
        3: stats[0].star3,
        4: stats[0].star4,
        5: stats[0].star5,
      };
    }

    await App.findByIdAndUpdate(
      appId,
      {
        ratingAverage,
        ratingCount,
        ratingDistribution,
      },
      { new: true }
    );

    return { ratingAverage, ratingCount, ratingDistribution };
  }

  /**
   * Creates a review for an application.
   */
  static async createReview({ appId, userId, rating, title = '', comment }) {
    // 1. Validate application (support ObjectId or slug)
    const isObjectId = mongoose.isValidObjectId(appId);
    const app = isObjectId ? await App.findById(appId) : await App.findOne({ slug: appId });
    if (!app) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    const resolvedAppId = app._id;

    // 2. Validate rating is integer 1 to 5
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    if (!comment || comment.trim().length === 0) {
      const error = new Error('Review comment is required');
      error.statusCode = 400;
      throw error;
    }

    // 3. Check for existing review by this user
    const existing = await Review.findOne({
      application: resolvedAppId,
      user: userId,
      status: { $ne: 'REMOVED' },
    });

    if (existing) {
      const error = new Error(
        'You have already reviewed this application. You can edit your existing review.'
      );
      error.statusCode = 400;
      error.code = 'DUPLICATE_REVIEW';
      throw error;
    }

    // 4. Verify download event
    const hasDownloaded = await DownloadEvent.exists({
      application: resolvedAppId,
      user: userId,
      eventType: { $in: ['DOWNLOAD_STARTED', 'DOWNLOAD_COMPLETED'] },
    });

    const isVerifiedDownload = !!hasDownloaded;

    // 5. Create review
    const review = await Review.create({
      application: resolvedAppId,
      user: userId,
      rating: parsedRating,
      title: title ? title.trim().substring(0, 100) : '',
      comment: comment.trim().substring(0, 2000),
      status: 'ACTIVE',
      isVerifiedDownload,
    });

    // 6. Recalculate rating aggregates
    await this.recalculateAppRating(resolvedAppId);

    return await Review.findById(review._id).populate('user', 'name username avatar');
  }

  /**
   * Retrieves paginated reviews for an application with user voting context.
   */
  static async getAppReviews(appId, { sort = 'recent', rating = null, page = 1, limit = 10, currentUserId = null }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Support both ObjectId and slug
    let resolvedAppId = appId;
    if (!mongoose.isValidObjectId(appId)) {
      const appDoc = await App.findOne({ slug: appId }).select('_id');
      if (appDoc) resolvedAppId = appDoc._id;
    }

    const query = {
      application: resolvedAppId,
      status: 'ACTIVE',
    };

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      query.rating = Number(rating);
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'helpful') {
      sortOptions = { helpfulCount: -1, createdAt: -1 };
    } else if (sort === 'highest') {
      sortOptions = { rating: -1, createdAt: -1 };
    } else if (sort === 'lowest') {
      sortOptions = { rating: 1, createdAt: -1 };
    }

    const [reviews, totalCount, app] = await Promise.all([
      Review.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name username avatar')
        .lean(),
      Review.countDocuments(query),
      App.findById(appId).select('ratingAverage ratingCount ratingDistribution').lean(),
    ]);

    // Check helpful votes and ownership if user is logged in
    let votedReviewIds = new Set();
    let userReview = null;

    if (currentUserId) {
      const reviewIds = reviews.map((r) => r._id);
      const userVotes = await ReviewVote.find({
        review: { $in: reviewIds },
        user: currentUserId,
      }).select('review').lean();

      votedReviewIds = new Set(userVotes.map((v) => v.review.toString()));

      // Also fetch user's own review if not already in list
      userReview = await Review.findOne({
        application: appId,
        user: currentUserId,
        status: { $ne: 'REMOVED' },
      }).populate('user', 'name username avatar').lean();
    }

    const enrichedReviews = reviews.map((review) => ({
      ...review,
      hasVotedHelpful: currentUserId ? votedReviewIds.has(review._id.toString()) : false,
      isOwner: currentUserId ? review.user?._id?.toString() === currentUserId.toString() : false,
    }));

    return {
      reviews: enrichedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
      ratingSummary: {
        ratingAverage: app?.ratingAverage || 0,
        ratingCount: app?.ratingCount || 0,
        ratingDistribution: app?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      userReview: userReview ? {
        ...userReview,
        isOwner: true,
      } : null,
    };
  }

  /**
   * Updates an existing review by its owner.
   */
  static async updateReview({ reviewId, userId, rating, title, comment }) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() !== userId.toString()) {
      const error = new Error('You are not authorized to edit this review');
      error.statusCode = 403;
      throw error;
    }

    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        const error = new Error('Rating must be an integer between 1 and 5');
        error.statusCode = 400;
        throw error;
      }
      review.rating = parsedRating;
    }

    if (title !== undefined) {
      review.title = title.trim().substring(0, 100);
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        const error = new Error('Review comment cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      review.comment = comment.trim().substring(0, 2000);
    }

    await review.save();
    await this.recalculateAppRating(review.application);

    return await Review.findById(review._id).populate('user', 'name username avatar');
  }

  /**
   * Soft deletes a review.
   */
  static async deleteReview({ reviewId, userId, isAdmin = false }) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (!isAdmin && review.user.toString() !== userId.toString()) {
      const error = new Error('You are not authorized to delete this review');
      error.statusCode = 403;
      throw error;
    }

    review.status = 'REMOVED';
    review.deletedAt = new Date();
    await review.save();

    await this.recalculateAppRating(review.application);

    return { success: true, message: 'Review successfully removed' };
  }

  /**
   * Upvotes a review as helpful.
   */
  static async voteHelpful({ reviewId, userId }) {
    const review = await Review.findById(reviewId);
    if (!review || review.status !== 'ACTIVE') {
      const error = new Error('Active review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() === userId.toString()) {
      const error = new Error('You cannot vote for your own review');
      error.statusCode = 400;
      throw error;
    }

    const existingVote = await ReviewVote.findOne({ review: reviewId, user: userId });
    if (existingVote) {
      const error = new Error('You have already marked this review as helpful');
      error.statusCode = 400;
      throw error;
    }

    await ReviewVote.create({ review: reviewId, user: userId });
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    return {
      helpfulCount: updatedReview.helpfulCount,
      hasVotedHelpful: true,
    };
  }

  /**
   * Removes helpful upvote.
   */
  static async unvoteHelpful({ reviewId, userId }) {
    const vote = await ReviewVote.findOneAndDelete({ review: reviewId, user: userId });
    if (!vote) {
      const error = new Error('Helpful vote not found');
      error.statusCode = 404;
      throw error;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: -1 } },
      { new: true }
    );

    return {
      helpfulCount: Math.max(0, updatedReview.helpfulCount),
      hasVotedHelpful: false,
    };
  }

  /**
   * Reports an inappropriate review.
   */
  static async reportReview({ reviewId, reporterId, reason, description = '' }) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    const existingReport = await ReviewReport.findOne({
      review: reviewId,
      reporter: reporterId,
      status: 'PENDING',
    });

    if (existingReport) {
      const error = new Error('You already have a pending report for this review');
      error.statusCode = 400;
      throw error;
    }

    const report = await ReviewReport.create({
      review: reviewId,
      reporter: reporterId,
      reason,
      description: description.trim().substring(0, 500),
      status: 'PENDING',
    });

    // Increment review report count and auto-flag if threshold exceeded
    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    if (updated.reportCount >= 5 && updated.status === 'ACTIVE') {
      updated.status = 'FLAGGED';
      await updated.save();
    }

    return { success: true, message: 'Review reported successfully', reportId: report._id };
  }

  /**
   * Allows the verified application developer to reply to a review.
   */
  static async developerReply({ reviewId, developerId, message }) {
    const review = await Review.findById(reviewId).populate('application');
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (!review.application || review.application.developer.toString() !== developerId.toString()) {
      const error = new Error('Only the developer of this application can reply to this review');
      error.statusCode = 403;
      throw error;
    }

    if (!message || !message.trim()) {
      const error = new Error('Reply message cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    review.developerReply = {
      message: message.trim().substring(0, 1000),
      repliedAt: new Date(),
    };

    await review.save();
    return review;
  }

  /**
   * Admin review moderation.
   */
  static async moderateReview({ reviewId, adminId, adminUser = null, status, reason = '' }) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = review.status;
    review.status = status;
    if (status === 'REMOVED') {
      review.deletedAt = new Date();
    }
    await review.save();

    const actorId = adminUser?._id || adminId;
    const actorRole = adminUser?.role || 'ADMIN';
    const actorEmail = adminUser?.email || '';

    await AuditLog.create({
      action: 'REVIEW_MODERATION',
      actor: actorId,
      actorRole: actorRole,
      actorEmail: actorEmail,
      resourceType: 'REVIEW',
      resourceId: reviewId,
      reason,
      previousState: { status: previousStatus },
      newState: { status },
    });

    await this.recalculateAppRating(review.application);
    return review;
  }

  /**
   * Fetches reviews for admin moderation.
   */
  static async getAdminReviews({ status, page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email username')
        .populate('application', 'name slug icon')
        .lean(),
      Review.countDocuments(query),
    ]);

    return {
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }
}

export default ReviewService;
