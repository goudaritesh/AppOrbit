import apiClient from './axios';

/**
 * Developer Version Management API Client
 */
export const versionApi = {
  /**
   * Get version history for an application
   */
  getVersions: async (appId, params = {}) => {
    return await apiClient.get(`/developer/apps/${appId}/versions`, { params });
  },

  /**
   * Get details for a single version artifact
   */
  getVersion: async (appId, versionId) => {
    return await apiClient.get(`/developer/apps/${appId}/versions/${versionId}`);
  },

  /**
   * Initialize an upload session
   */
  initializeUpload: async (appId, data) => {
    return await apiClient.post(`/developer/apps/${appId}/versions/upload-init`, data);
  },

  /**
   * Upload APK binary via multipart form with upload progress tracking
   */
  uploadApk: async (appId, formData, onUploadProgress, sync = false) => {
    return await apiClient.post(`/developer/apps/${appId}/versions/upload${sync ? '?sync=true' : ''}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  /**
   * Update version release notes or display name
   */
  updateVersion: async (appId, versionId, data) => {
    return await apiClient.patch(`/developer/apps/${appId}/versions/${versionId}`, data);
  },

  /**
   * Set version as current active candidate
   */
  setCurrentVersion: async (appId, versionId) => {
    return await apiClient.post(`/developer/apps/${appId}/versions/${versionId}/set-current`);
  },

  /**
   * Delete version artifact and storage object
   */
  deleteVersion: async (appId, versionId) => {
    return await apiClient.delete(`/developer/apps/${appId}/versions/${versionId}`);
  },

  /**
   * Get short-lived signed download URL
   */
  getDownloadUrl: async (appId, versionId) => {
    return await apiClient.get(`/developer/apps/${appId}/versions/${versionId}/download-url`);
  },
};

export default versionApi;
