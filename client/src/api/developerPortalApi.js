import { apiClient } from './axios';

/**
 * Developer Portal API Client (Phase 4 Application Management)
 */

/**
 * Fetch applications owned by the authenticated developer
 * @param {Object} params - { page, limit, status, category, platform, search, sort }
 */
export const getDeveloperApps = async (params = {}) => {
  return await apiClient.get('/developer/apps', { params });
};

/**
 * Fetch a single application owned by the authenticated developer
 * @param {string} appId
 */
export const getDeveloperApp = async (appId) => {
  return await apiClient.get(`/developer/apps/${appId}`);
};

/**
 * Create a new application draft
 * @param {Object} data
 */
export const createApp = async (data) => {
  return await apiClient.post('/developer/apps', data);
};

/**
 * Update an existing application owned by developer
 * @param {string} appId
 * @param {Object} data
 */
export const updateApp = async (appId, data) => {
  return await apiClient.patch(`/developer/apps/${appId}`, data);
};

/**
 * Permanently delete a draft application
 * @param {string} appId
 */
export const deleteApp = async (appId) => {
  return await apiClient.delete(`/developer/apps/${appId}`);
};

/**
 * Submit an application for review
 * @param {string} appId
 */
export const submitApp = async (appId) => {
  return await apiClient.post(`/developer/apps/${appId}/submit`);
};

/**
 * Archive an application
 * @param {string} appId
 */
export const archiveApp = async (appId) => {
  return await apiClient.post(`/developer/apps/${appId}/archive`);
};

/**
 * Restore an archived application back to draft
 * @param {string} appId
 */
export const restoreApp = async (appId) => {
  return await apiClient.post(`/developer/apps/${appId}/restore`);
};

/**
 * Fetch aggregated developer analytics
 */
export const getDeveloperAnalytics = async () => {
  return await apiClient.get('/developer/analytics');
};

/**
 * Fetch analytics for a specific application
 * @param {string} appId
 */
export const getAppAnalytics = async (appId) => {
  return await apiClient.get(`/developer/apps/${appId}/analytics`);
};

/**
 * Sprint 3: Upload Application Icon
 * @param {string} appId
 * @param {File} file
 * @param {Function} onProgress
 */
export const uploadAppIcon = async (appId, file, onProgress) => {
  const formData = new FormData();
  formData.append('icon', file);
  return await apiClient.post(`/apps/${appId}/icon`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // Disable global 15s timeout for large file uploads
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      }
    },
  });
};

/**
 * Sprint 3: Upload Application Screenshots
 * @param {string} appId
 * @param {File[]} files
 * @param {Function} onProgress
 */
export const uploadAppScreenshots = async (appId, files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('screenshots', file);
  });
  return await apiClient.post(`/apps/${appId}/screenshots`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      }
    },
  });
};

/**
 * Sprint 3: Upload Application Demo Video
 * @param {string} appId
 * @param {File} file
 * @param {Function} onProgress
 */
export const uploadAppDemoVideo = async (appId, file, onProgress) => {
  const formData = new FormData();
  formData.append('video', file);
  return await apiClient.post(`/apps/${appId}/demo-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      }
    },
  });
};

/**
 * Sprint 3: Upload Application APK Binary
 * @param {string} appId
 * @param {File} file
 * @param {Object} data
 * @param {Function} onProgress
 */
export const uploadAppApk = async (appId, file, data = {}, onProgress) => {
  const formData = new FormData();
  formData.append('apk', file);
  if (data.versionName) formData.append('versionName', data.versionName);
  if (data.versionCode) formData.append('versionCode', data.versionCode);
  if (data.releaseNotes) formData.append('releaseNotes', data.releaseNotes);

  return await apiClient.post(`/apps/${appId}/apk`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      }
    },
  });
};

/**
 * Sprint 3: Delete Screenshot
 * @param {string} appId
 * @param {string} screenshotId
 */
export const deleteAppScreenshot = async (appId, screenshotId) => {
  return await apiClient.delete(`/apps/${appId}/screenshots/${screenshotId}`);
};

/**
 * Sprint 3: Delete Media Asset
 * @param {string} appId
 * @param {string} mediaId
 */
export const deleteAppMedia = async (appId, mediaId) => {
  return await apiClient.delete(`/apps/${appId}/media/${mediaId}`);
};

export default {
  getDeveloperApps,
  getDeveloperApp,
  createApp,
  updateApp,
  deleteApp,
  submitApp,
  archiveApp,
  restoreApp,
  getDeveloperAnalytics,
  getAppAnalytics,
  uploadAppIcon,
  uploadAppScreenshots,
  uploadAppDemoVideo,
  uploadAppApk,
  deleteAppScreenshot,
  deleteAppMedia,
};
