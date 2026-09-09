import apiClient from './axios';

/**
 * Security Analysis API Service (Phase 6 Production Implementation)
 * Provides developer and administrative hooks for security reports, scan status, and reviews.
 */
export const securityApi = {
  /**
   * Get developer security report for an application version
   */
  getSecurityReport: async (appId, versionId) => {
    return await apiClient.get(`/developer/apps/${appId}/versions/${versionId}/security`);
  },

  /**
   * Lightweight scan status for real-time polling
   */
  getSecurityStatus: async (appId, versionId) => {
    return await apiClient.get(`/developer/apps/${appId}/versions/${versionId}/security/status`);
  },

  /**
   * Request manual security review for a version
   */
  requestReview: async (appId, versionId, { reason }) => {
    return await apiClient.post(
      `/developer/apps/${appId}/versions/${versionId}/security/request-review`,
      { reason }
    );
  },

  /**
   * Admin: List platform security reports
   */
  getAdminReports: async (params = {}) => {
    return await apiClient.get('/admin/security/reports', { params });
  },

  /**
   * Admin: Get detailed security report by ID
   */
  getAdminReportById: async (reportId) => {
    return await apiClient.get(`/admin/security/reports/${reportId}`);
  },

  /**
   * Admin: Submit review verdict
   */
  submitAdminReview: async (reportId, { decision, adminNotes }) => {
    return await apiClient.post(`/admin/security/reports/${reportId}/review`, {
      decision,
      adminNotes,
    });
  },

  /**
   * Admin: Force security rescan
   */
  triggerRescan: async (appId, versionId, { reason } = {}) => {
    return await apiClient.post(`/admin/security/apps/${appId}/versions/${versionId}/rescan`, {
      reason,
    });
  },
};

export default securityApi;
