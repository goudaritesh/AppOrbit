import { Router } from 'express';
import {
  getApps,
  getFeaturedApps,
  getRecentApps,
  getAppBySlug,
} from '../controllers/appController.js';
import {
  createApp,
  updateApp,
  deleteApp,
  submitApp,
} from '../controllers/developerAppController.js';
import {
  uploadIcon,
  uploadScreenshots as uploadScreenshotsMiddleware,
  uploadDemoVideo as uploadDemoVideoMiddleware,
  uploadApk,
} from '../middleware/uploadMiddleware.js';
import {
  uploadAppIcon,
  uploadScreenshots as uploadScreenshotsHandler,
  uploadDemoVideo as uploadDemoVideoHandler,
  uploadAppApk,
  deleteScreenshot,
  deleteMedia,
} from '../controllers/uploadController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { verifyAppOwnership } from '../middleware/ownershipMiddleware.js';
import {
  createAppValidation,
  updateAppValidation,
  stripRestrictedAppFields,
} from '../validators/developerAppValidator.js';
import {
  sanitizeQueryParams,
  appQueryValidation,
  validate,
} from '../validators/queryValidator.js';
import { appReviewRouter } from '../modules/reviews/review.routes.js';
import { appDownloadRouter } from '../modules/downloads/download.routes.js';
import {
  getPopularApps,
  getTrendingApps,
  getNewReleases,
  getRecentlyUpdated,
  getRelatedApps,
} from '../modules/search/search.controller.js';
import { cacheRoute } from '../middleware/cacheMiddleware.js';

const router = Router();

// 1. Fixed & Aggregated Discovery Endpoints (Declared first to avoid /:slug routing conflicts)
router.get('/featured', cacheRoute(120), getFeaturedApps);
router.get('/popular', cacheRoute(120), getPopularApps);
router.get('/trending', cacheRoute(120), getTrendingApps);
router.get('/new', cacheRoute(120), getNewReleases);
router.get('/recent', cacheRoute(120), getRecentApps);
router.get('/recently-updated', cacheRoute(120), getRecentlyUpdated);

// 2. Nested Application Routes (Reviews & Secure Downloads)
router.use('/:appId/reviews', appReviewRouter);
router.use('/:appId/download', appDownloadRouter);

// 3. Developer App Management Aliases (POST /apps, PATCH /apps/:appId, DELETE /apps/:appId, POST /apps/:appId/submit)
router.post(
  '/',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  stripRestrictedAppFields,
  validate(createAppValidation),
  createApp
);

router.patch(
  '/:appId',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  stripRestrictedAppFields,
  validate(updateAppValidation),
  updateApp
);

router.delete(
  '/:appId',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  deleteApp
);

router.post(
  '/:appId/submit',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  submitApp
);

// Sprint 3: App Media & APK Upload Endpoints (/api/v1/apps/:id/... or :appId)
router.post(
  '/:id/icon',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  uploadIcon,
  uploadAppIcon
);

router.post(
  '/:id/screenshots',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  uploadScreenshotsMiddleware,
  uploadScreenshotsHandler
);

router.post(
  '/:id/demo-video',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  uploadDemoVideoMiddleware,
  uploadDemoVideoHandler
);

router.post(
  '/:id/apk',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  uploadApk,
  uploadAppApk
);

router.delete(
  '/:id/screenshots/:screenshotId',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  deleteScreenshot
);

router.delete(
  '/:id/media/:mediaId',
  protect,
  authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'),
  verifyAppOwnership,
  deleteMedia
);

// 4. Main Marketplace Discovery (Search, Filter, Sort, Paginate)
router.get('/', sanitizeQueryParams, validate(appQueryValidation), getApps);

// 5. Application Details & Related Apps by Slug or ID
router.get('/:slug/related', getRelatedApps);
router.get('/:slug', getAppBySlug);

export default router;
