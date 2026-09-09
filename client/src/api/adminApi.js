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

  // Audit Logs
  getAuditLogs: (params = {}) => apiClient.get('/admin/audit-logs', { params }),

  // Platform Settings & Maintenance
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),
};

export default adminApi;
