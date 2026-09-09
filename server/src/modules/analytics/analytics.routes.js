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

/* ==========================================
   ADMIN PLATFORM ANALYTICS ROUTER HELPER (/api/admin)
   ========================================== */
export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  '/analytics',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getAdminPlatformAnalytics
);
