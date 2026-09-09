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

// 4. Main Marketplace Discovery (Search, Filter, Sort, Paginate)
router.get('/', sanitizeQueryParams, validate(appQueryValidation), getApps);

// 5. Application Details & Related Apps by Slug or ID
router.get('/:slug/related', getRelatedApps);
router.get('/:slug', getAppBySlug);

export default router;
