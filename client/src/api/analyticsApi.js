import api from './axios';

export const analyticsApi = {
  // Track client analytics event
  trackEvent: (data) =>
    api.post('/analytics/event', data),

  // Developer portfolio overview
  getDeveloperOverview: (params = {}) =>
    api.get('/developer/analytics', { params }),

  // Single app analytics
  getAppAnalytics: (appId, params = {}) =>
    api.get(`/developer/apps/${appId}/analytics`, { params }),

  // Admin platform analytics
  getAdminPlatformAnalytics: (params = {}) =>
    api.get('/admin/analytics', { params }),
};

export default analyticsApi;
