import apiClient from './axios.js';

/**
 * Notification API client for inbox, real-time alerts, preferences, and FCM device tokens
 */
export const notificationApi = {
  /**
   * Get user notifications with optional filtering & pagination
   */
  getNotifications: (params = {}) =>
    apiClient.get('/notifications', { params }),

  /**
   * Get unread notification counter badge
   */
  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  /**
   * Mark single notification as read
   */
  markAsRead: (notificationId) =>
    apiClient.post(`/notifications/${notificationId}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () =>
    apiClient.post('/notifications/read-all'),

  /**
   * Delete a notification
   */
  deleteNotification: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),

  /**
   * Get multi-channel notification preferences
   */
  getPreferences: () =>
    apiClient.get('/notifications/preferences'),

  /**
   * Update notification preferences
   */
  updatePreferences: (preferences) =>
    apiClient.put('/notifications/preferences', preferences),

  /**
   * Register FCM Web Push device token
   */
  registerDeviceToken: (payload) =>
    apiClient.post('/notifications/device-tokens', payload),

  /**
   * Unregister FCM Web Push device token
   */
  unregisterDeviceToken: (token) =>
    apiClient.delete(`/notifications/device-tokens/${encodeURIComponent(token)}`),
};

export default notificationApi;
