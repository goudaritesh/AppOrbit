import apiClient from './axios';

/**
 * Health check API service
 */
export const healthApi = {
  /**
   * Pings the server health check endpoint
   * @returns {Promise<{success: boolean, message: string, timestamp: string}>}
   */
  checkHealth: async () => {
    return await apiClient.get('/health');
  },
};

export default healthApi;
