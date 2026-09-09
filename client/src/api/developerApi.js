import apiClient from './axios';

/**
 * Developer Profile API Service
 */
export const developerApi = {
  /**
   * Retrieve authenticated developer's business/portfolio profile
   */
  getProfile: async () => {
    return await apiClient.get('/developer/profile');
  },

  /**
   * Update developer profile fields
   * @param {object} data - { companyName, website, githubProfile, portfolioUrl, developerBio }
   */
  updateProfile: async (data) => {
    return await apiClient.patch('/developer/profile', data);
  },
};

export default developerApi;
