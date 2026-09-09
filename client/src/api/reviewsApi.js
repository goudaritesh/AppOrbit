import api from './axios';

export const reviewsApi = {
  // Get reviews for an application
  getAppReviews: (appId, params = {}) =>
    api.get(`/apps/${appId}/reviews`, { params }),

  // Submit a review
  createReview: (appId, data) =>
    api.post(`/apps/${appId}/reviews`, data),

  // Update a review
  updateReview: (reviewId, data) =>
    api.put(`/reviews/${reviewId}`, data),

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

  // Developer reply
  developerReply: (reviewId, data) =>
    api.post(`/reviews/${reviewId}/reply`, data),

  // Admin moderation list
  getAdminReviews: (params = {}) =>
    api.get('/admin/reviews', { params }),

  // Admin moderate review
  moderateReview: (reviewId, data) =>
    api.patch(`/admin/reviews/${reviewId}/moderate`, data),
};

export default reviewsApi;
