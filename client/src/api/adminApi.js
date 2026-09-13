import apiClient from './axios';

/**
 * Admin API Client (Phase 7 Production Implementation)
 * Provides frontend client methods for all administrative operations.
 */
export const adminApi = {
  // Dashboard & Search
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getDashboardAnalytics: (range = '30d') => apiClient.get(`/admin/dashboard/analytics?range=${range}`),
  globalSearch: (q) => apiClient.get(`/admin/search?q=${encodeURIComponent(q)}`),

  // Application Moderation
  getApps: (params = {}) => apiClient.get('/admin/apps', { params }),
  getAppById: (appId) => apiClient.get(`/admin/apps/${appId}`),
  approveApp: (appId, data) => apiClient.post(`/admin/apps/${appId}/approve`, data),
  patchApproveApp: (appId, data) => apiClient.patch(`/admin/apps/${appId}/approve`, data),
  rejectApp: (appId, data) => apiClient.post(`/admin/apps/${appId}/reject`, data),
  patchRejectApp: (appId, data) => apiClient.patch(`/admin/apps/${appId}/reject`, data),
  requestChanges: (appId, data) => apiClient.post(`/admin/apps/${appId}/request-changes`, data),
  patchRequestChanges: (appId, data) => apiClient.patch(`/admin/apps/${appId}/request-changes`, data),
  suspendApp: (appId, data) => apiClient.patch(`/admin/apps/${appId}/suspend`, data),
  blockApp: (appId, data) => apiClient.post(`/admin/apps/${appId}/block`, data),
  unpublishApp: (appId, data) => apiClient.post(`/admin/apps/${appId}/unpublish`, data),

  // Developer Management
  getDevelopers: (params = {}) => apiClient.get('/admin/developers', { params }),
  getDeveloperById: (developerId) => apiClient.get(`/admin/developers/${developerId}`),
  updateDeveloperStatus: (developerId, data) => apiClient.patch(`/admin/developers/${developerId}/status`, data),
  updateDeveloperPlan: (developerId, data) => apiClient.patch(`/admin/developers/${developerId}/plan`, data),
  suspendDeveloper: (developerId, data) => apiClient.post(`/admin/developers/${developerId}/suspend`, data),
  restoreDeveloper: (developerId) => apiClient.post(`/admin/developers/${developerId}/restore`),
  restrictDeveloper: (developerId, data) => apiClient.post(`/admin/developers/${developerId}/restrict`, data),
  addDeveloperNote: (developerId, data) => apiClient.post(`/admin/developers/${developerId}/notes`, data),

  // User Management
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),
  getUserById: (userId) => apiClient.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => apiClient.post(`/admin/users/${userId}/status`, data),

  // Security Review Center
  getSecurityReports: (params = {}) => apiClient.get('/admin/security/reports', { params }),
  getSecurityReportById: (reportId) => apiClient.get(`/admin/security/reports/${reportId}`),
  submitSecurityReview: (reportId, data) => apiClient.post(`/admin/security/reports/${reportId}/review`, data),
  triggerRescan: (appId, versionId) => apiClient.post(`/admin/security/apps/${appId}/versions/${versionId}/rescan`),

  // Subscriptions & Plans
  getSubscriptionPlans: () => apiClient.get('/admin/subscriptions/plans'),
  createSubscriptionPlan: (data) => apiClient.post('/admin/subscriptions/plans', data),
  updateSubscriptionPlan: (planId, data) => apiClient.put(`/admin/subscriptions/plans/${planId}`, data),
  getDeveloperSubscriptions: (params = {}) => apiClient.get('/admin/subscriptions', { params }),
  manualUpdateSubscription: (developerId, data) => apiClient.post(`/admin/subscriptions/${developerId}/update`, data),

  // Payment Management
  getPayments: (params = {}) => apiClient.get('/admin/payments', { params }),
  getPaymentById: (paymentId) => apiClient.get(`/admin/payments/${paymentId}`),
  verifyPayment: (paymentId, data) => apiClient.post(`/admin/payments/${paymentId}/verify`, data),
  patchVerifyPayment: (paymentId, data) => apiClient.patch(`/admin/payments/${paymentId}/verify`, data),

  // Support Ticketing
  getSupportTickets: (params = {}) => apiClient.get('/admin/support', { params }),
  getSupportTicketById: (ticketId) => apiClient.get(`/admin/support/${ticketId}`),
  addTicketMessage: (ticketId, data) => apiClient.post(`/admin/support/${ticketId}/message`, data),
  updateTicketStatus: (ticketId, data) => apiClient.post(`/admin/support/${ticketId}/status`, data),
  assignTicket: (ticketId, data) => apiClient.post(`/admin/support/${ticketId}/assign`, data),

  // Platform Reports
  getReports: (params = {}) => apiClient.get('/admin/reports', { params }),
  getReportById: (reportId) => apiClient.get(`/admin/reports/${reportId}`),
  resolveReport: (reportId, data) => apiClient.post(`/admin/reports/${reportId}/resolve`, data),
  patchReportStatus: (reportId, data) => apiClient.patch(`/admin/reports/${reportId}`, data),

  // Notifications
  getNotifications: (params = {}) => apiClient.get('/admin/notifications', { params }),
  markNotificationAsRead: (id) => apiClient.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.post('/admin/notifications/read-all'),

  // Audit Logs & Activity Logs
  getAuditLogs: (params = {}) => apiClient.get('/admin/audit-logs', { params }),
  getActivityLogs: (params = {}) => apiClient.get('/admin/activity-logs', { params }),

  // Platform Settings & Maintenance
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),

  // Sprint 10 Deep Analytics & Observability
  getPlatformAnalytics: (range = '30d') => apiClient.get(`/admin/analytics?range=${range}`),
  getRevenueAnalytics: (range = '30d') => apiClient.get(`/admin/analytics/revenue?range=${range}`),
  getUserAnalytics: (range = '30d') => apiClient.get(`/admin/analytics/users?range=${range}`),
  getAppAnalytics: (range = '30d') => apiClient.get(`/admin/analytics/apps?range=${range}`),
  getSearchAnalytics: (range = '30d') => apiClient.get(`/admin/analytics/search?range=${range}`),
  getSystemHealth: () => apiClient.get('/admin/system-health'),
  triggerDailyAggregation: (date) => apiClient.post('/admin/analytics/aggregate', { date }),

  // Sprint 12 Beta Program & User Testing
  getBetaAnalytics: () => apiClient.get('/admin/beta/analytics'),
  getBugReports: (params = {}) => apiClient.get('/bugs', { params }),
  updateBugReport: (id, data) => apiClient.patch(`/bugs/${id}`, data),
  getFeedbacks: (params = {}) => apiClient.get('/feedback', { params }),
  updateFeedback: (id, data) => apiClient.patch(`/feedback/${id}`, data),
  getIncidents: (params = {}) => apiClient.get('/admin/beta/incidents', { params }),
  createIncident: (data) => apiClient.post('/admin/beta/incidents', data),
  updateIncident: (id, data) => apiClient.patch(`/admin/beta/incidents/${id}`, data),

  // Public / User Beta Actions
  submitPublicFeedback: (data) => apiClient.post('/feedback', data),
  submitPublicBug: (data) => apiClient.post('/bugs', data),

  // Sprint 13 Public Beta, Growth, Referrals & Waitlist
  getGrowthAnalytics: () => apiClient.get('/admin/growth/analytics'),
  getWaitlist: (params = {}) => apiClient.get('/waitlist', { params }),
  getWaitlistSummary: () => apiClient.get('/waitlist/summary'),
  joinWaitlist: (data) => apiClient.post('/waitlist', data),
  getMyReferralCode: () => apiClient.get('/referrals/code'),
  getMyReferrals: () => apiClient.get('/referrals/me'),
  validateInviteCode: (code) => apiClient.post('/referrals/validate', { code }),
  getAdminReferrals: (params = {}) => apiClient.get('/referrals/admin', { params }),
  getFeaturedApps: (limit = 6) => apiClient.get(`/apps/featured?limit=${limit}`),
  featureApp: (id, data) => apiClient.patch(`/admin/apps/${id}/feature`, data),
  // Added missing admin endpoints
  getAdminReviews: (params = {}) => apiClient.get('/admin/reviews', { params }),
  moderateReview: (reviewId, data) => apiClient.patch(`/admin/reviews/${reviewId}/moderate`, data),
  getAdminSecurityReport: (appId) => apiClient.get(`/admin/apps/${appId}/security`),
  approvePayment: (paymentId, data) => apiClient.patch(`/admin/payments/${paymentId}/approve`, data),
  rejectPayment: (paymentId, data) => apiClient.patch(`/admin/payments/${paymentId}/reject`, data),
  deleteSubscriptionPlan: (planId) => apiClient.delete(`/admin/subscriptions/plans/${planId}`),
  getPlatformSettings: () => apiClient.get('/admin/settings'),
  updatePlatformSettings: (data) => apiClient.put('/admin/settings', data),
  globalAdminSearch: (q) => apiClient.get(`/admin/search?q=${encodeURIComponent(q)}`),
  // End of added endpoints
};

export default adminApi;
