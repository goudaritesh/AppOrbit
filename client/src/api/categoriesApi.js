import { apiClient } from './axios';

/**
 * Categories API Client (Phase 3 Category Browsing)
 */

/**
 * Fetch all active categories with dynamic app counts
 */
export const getCategories = async () => {
  return await apiClient.get('/categories');
};

/**
 * Fetch paginated applications belonging to a category
 * @param {string} slug
 * @param {Object} params
 */
export const getCategoryApps = async (slug, params = {}) => {
  return await apiClient.get(`/categories/${slug}/apps`, { params });
};

export default {
  getCategories,
  getCategoryApps,
};
