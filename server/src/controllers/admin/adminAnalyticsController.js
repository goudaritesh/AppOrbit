import AnalyticsService from '../../modules/analytics/analytics.service.js';
import ActivityLogService from '../../services/activityLogService.js';
import MonitoringService from '../../services/monitoringService.js';
import { runDailyAnalyticsAggregation } from '../../jobs/analyticsAggregationJob.js';
import apiResponse from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Controller for Admin Deep Analytics, Observability, and Activity Logs (Sprint 10)
 */
export const getPlatformOverviewAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const data = await AnalyticsService.getAdminPlatformAnalytics(range);
  return apiResponse.success(res, 200, 'Platform analytics retrieved successfully', data);
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const data = await AnalyticsService.getRevenueAnalytics(range);
  return apiResponse.success(res, 200, 'Revenue analytics retrieved successfully', data);
});

export const getUserAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const data = await AnalyticsService.getUserAnalytics(range);
  return apiResponse.success(res, 200, 'User growth analytics retrieved successfully', data);
});

export const getAppAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const data = await AnalyticsService.getAppAnalyticsSummary(range);
  return apiResponse.success(res, 200, 'Application analytics retrieved successfully', data);
});

export const getSearchAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const data = await AnalyticsService.getSearchAnalytics(range);
  return apiResponse.success(res, 200, 'Search insights retrieved successfully', data);
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const data = await ActivityLogService.getActivityLogs(req.query);
  return apiResponse.success(res, 200, 'Activity logs retrieved successfully', data);
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const data = await MonitoringService.getSystemHealth();
  return apiResponse.success(res, 200, 'System health diagnostics retrieved successfully', data);
});

export const triggerDailyAggregation = asyncHandler(async (req, res) => {
  const { date } = req.body;
  const result = await runDailyAnalyticsAggregation(date);
  return apiResponse.success(res, 200, 'Daily analytics aggregation completed successfully', result);
});

export default {
  getPlatformOverviewAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getAppAnalytics,
  getSearchAnalytics,
  getActivityLogs,
  getSystemHealth,
  triggerDailyAggregation,
};
