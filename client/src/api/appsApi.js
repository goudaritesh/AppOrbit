import { apiClient } from './axios';

/**
 * Apps API Client (Phase 3 Marketplace Discovery)
 */

/**
 * Fetch paginated applications with search, category, platform, tech, and sort parameters
 * @param {Object} params - Query filters { search, category, platform, technology, verified, sort, page, limit }
 */
export const getApps = async (params = {}) => {
  return await apiClient.get('/apps', { params });
};

/**
 * Fetch single application details by URL slug
 * @param {string} slug
 */
export const getAppBySlug = async (slug) => {
  return await apiClient.get(`/apps/${slug}`);
};

/**
 * Fetch top featured applications
 * @param {number} limit
 */
export const getFeaturedApps = async (limit = 6) => {
  return await apiClient.get('/apps/featured', { params: { limit } });
};

/**
 * Fetch popular applications
 * @param {number} limit
 */
export const getPopularApps = async (limit = 6) => {
  return await apiClient.get('/apps/popular', { params: { limit } });
};

/**
 * Fetch recently published applications
 * @param {number} limit
 */
export const getRecentApps = async (limit = 6) => {
  return await apiClient.get('/apps/recent', { params: { limit } });
};

/**
 * Fetch latest applications (Sprint 6 alias)
 * @param {number} limit
 */
export const getLatestApps = async (limit = 6) => {
  return await apiClient.get('/apps/latest', { params: { limit } });
};

/**
 * Search applications (Sprint 6 API)
 * @param {string} query
 * @param {Object} params
 */
export const searchApps = async (query, params = {}) => {
  return await apiClient.get('/apps/search', { params: { q: query, ...params } });
};

/**
 * Fetch related applications for a given app
 * @param {string} slug
 */
export const getRelatedApps = async (slug) => {
  return await apiClient.get(`/apps/${slug}/related`);
};

export default {
  getApps,
  getAppBySlug,
  getFeaturedApps,
  getPopularApps,
  getRecentApps,
  getLatestApps,
  searchApps,
  getRelatedApps,
};
