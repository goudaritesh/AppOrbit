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
};
