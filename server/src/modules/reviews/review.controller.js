import ReviewService from './review.service.js';

export const createReview = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { rating, title, comment } = req.body;
    const review = await ReviewService.createReview({
      appId,
      userId: req.user._id,
      rating,
      title,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppReviews = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { sort, rating, page, limit } = req.query;
    const currentUserId = req.user?._id || null;

    const result = await ReviewService.getAppReviews(appId, {
      sort,
      rating,
      page,
      limit,
      currentUserId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await ReviewService.updateReview({
      reviewId,
      userId: req.user._id,
      rating,
      title,
      comment,
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const result = await ReviewService.deleteReview({
      reviewId,
      userId: req.user._id,
      isAdmin,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const voteHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const result = await ReviewService.voteHelpful({
      reviewId,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Marked review as helpful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const unvoteHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const result = await ReviewService.unvoteHelpful({
      reviewId,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Removed helpful vote',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const reportReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;

    const result = await ReviewService.reportReview({
      reviewId,
      reporterId: req.user._id,
      reason,
      description,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const developerReply = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { message } = req.body;

    const review = await ReviewService.developerReply({
      reviewId,
      developerId: req.user._id,
      message,
    });

    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await ReviewService.getAdminReviews({ status, page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status, reason } = req.body;

    const review = await ReviewService.moderateReview({
      reviewId,
      adminId: req.user._id,
      adminUser: req.user,
      status,
      reason,
    });

    res.json({
      success: true,
      message: 'Review status updated by admin',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
