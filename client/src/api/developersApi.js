import { apiClient } from './axios';

/**
 * Public Developers API Client (Phase 3 Public Profiles)
 */

/**
 * Fetch public developer profile and published apps
 * @param {string} developerId - User ID or developer identifier
 */
export const getDeveloperProfile = async (developerId) => {
  return await apiClient.get(`/developers/${developerId}`);
};

export default {
  getDeveloperProfile,
};
