import api from './axios';

export const reviewsApi = {
  // Get reviews for an application
  getAppReviews: (appId, params = {}) =>
    api.get(`/apps/${appId}/reviews`, { params }),

  // Submit a review
  createReview: (appId, data) =>
    api.post(`/apps/${appId}/reviews`, data),

  // Update a review (PATCH or PUT)
  updateReview: (reviewId, data) =>
    api.patch(`/reviews/${reviewId}`, data),

  // Delete a review
  deleteReview: (reviewId) =>
    api.delete(`/reviews/${reviewId}`),

  // Vote helpful
  voteHelpful: (reviewId) =>
    api.post(`/reviews/${reviewId}/helpful`),

  // Remove helpful vote
  unvoteHelpful: (reviewId) =>
    api.delete(`/reviews/${reviewId}/helpful`),

  // Report inappropriate review
  reportReview: (reviewId, data) =>
    api.post(`/reviews/${reviewId}/report`, data),

  // Developer response (support both /respond and /reply)
  developerReply: (reviewId, data) =>
    api.post(`/reviews/${reviewId}/respond`, data),
  respondReview: (reviewId, data) =>
    api.post(`/reviews/${reviewId}/respond`, data),

  // Developer review dashboard list
  getDeveloperReviews: (params = {}) =>
    api.get('/developer/reviews', { params }),

  // Admin moderation list
  getAdminReviews: (params = {}) =>
    api.get('/admin/reviews', { params }),

  // Admin moderate review
  moderateReview: (reviewId, data) =>
    api.patch(`/admin/reviews/${reviewId}/status`, data),
  updateReviewStatus: (reviewId, data) =>
    api.patch(`/admin/reviews/${reviewId}/status`, data),
};

export default reviewsApi;
