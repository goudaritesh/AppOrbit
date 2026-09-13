import GrowthAnalyticsService from '../services/growthAnalyticsService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getGrowthAnalytics = asyncHandler(async (req, res) => {
  const data = await GrowthAnalyticsService.getGrowthAnalytics();
  return sendSuccess(res, 'Platform growth and acquisition metrics retrieved successfully', data);
});

export default {
  getGrowthAnalytics,
};
