import api from './axios';

export const searchApi = {
  // Advanced search with filters and sorting
  search: (params = {}) =>
    api.get('/search', { params }),

  // Autocomplete suggestions
  getSuggestions: (q) =>
    api.get('/search/suggestions', { params: { q } }),

  // Popular search queries
  getPopularSearches: () =>
    api.get('/search/popular'),

  // User search history
  getSearchHistory: () =>
    api.get('/search/history'),

  // Clear user search history
  clearSearchHistory: () =>
    api.delete('/search/history'),

  // Discovery feeds
  getPopularApps: (params = {}) =>
    api.get('/apps/popular', { params }),

  getTrendingApps: (params = {}) =>
    api.get('/apps/trending', { params }),

  getNewReleases: (params = {}) =>
    api.get('/apps/new', { params }),

  getRecentlyUpdated: (params = {}) =>
    api.get('/apps/recently-updated', { params }),

  getRelatedApps: (appId, params = {}) =>
    api.get(`/apps/${appId}/related`, { params }),
};

export default searchApi;
