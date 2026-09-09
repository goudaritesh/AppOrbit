import apiClient from './axios.js';

/**
 * Subscription API client for developer plans, usage quotas, and lifecycle transitions
 */
export const subscriptionApi = {
  /**
   * Fetch all active platform subscription tiers
   */
  getPlans: () => apiClient.get('/subscription/plans'),

  /**
   * Get developer's current active or latest subscription
   */
  getCurrentSubscription: () => apiClient.get('/developer/subscription'),

  /**
   * Get developer application publishing quota and usage telemetry
   */
  getUsage: () => apiClient.get('/developer/subscription/usage'),

  /**
   * Cancel auto-renewal for current active subscription
   */
  cancelSubscription: (reason = '') =>
    apiClient.post('/developer/subscription/cancel', { reason }),

  /**
   * Transition plan tier (upgrade or schedule downgrade)
   */
  changePlan: (targetPlanId, downgradeStrategy = 'END_OF_CYCLE') =>
    apiClient.post('/developer/subscription/change-plan', {
      targetPlanId,
      downgradeStrategy,
    }),
};

export default subscriptionApi;
