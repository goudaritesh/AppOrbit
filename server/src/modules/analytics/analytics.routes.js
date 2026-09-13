import { Router } from 'express';
import {
  trackEvent,
  getDeveloperOverview,
  getAppAnalytics,
  getAdminPlatformAnalytics,
} from './analytics.controller.js';
import { protect, optionalAuth, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

/* ==========================================
   ANALYTICS EVENT INGESTION (/api/analytics)
   ========================================== */
router.post('/event', optionalAuth, trackEvent);

export default router;

/* ==========================================
   DEVELOPER ANALYTICS ROUTER HELPER (/api/developer)
   ========================================== */
export const developerAnalyticsRouter = Router();

developerAnalyticsRouter.get(
  '/analytics',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  getDeveloperOverview
);

developerAnalyticsRouter.get(
  '/apps/:appId/analytics',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  getAppAnalytics
);

import {
  getPlatformOverviewAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getAppAnalytics as getAdminAppAnalytics,
  getSearchAnalytics,
  getActivityLogs,
  getSystemHealth,
  triggerDailyAggregation,
} from '../../controllers/admin/adminAnalyticsController.js';

/* ==========================================
   ADMIN PLATFORM ANALYTICS ROUTER HELPER (/api/admin)
   ========================================== */
export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  '/analytics',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getPlatformOverviewAnalytics
);

adminAnalyticsRouter.get(
  '/analytics/revenue',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getRevenueAnalytics
);

adminAnalyticsRouter.get(
  '/analytics/users',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getUserAnalytics
);

adminAnalyticsRouter.get(
  '/analytics/apps',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getAdminAppAnalytics
);

adminAnalyticsRouter.get(
  '/analytics/search',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getSearchAnalytics
);

adminAnalyticsRouter.post(
  '/analytics/aggregate',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  triggerDailyAggregation
);

adminAnalyticsRouter.get(
  '/activity-logs',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getActivityLogs
);

adminAnalyticsRouter.get(
  '/system-health',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getSystemHealth
);
