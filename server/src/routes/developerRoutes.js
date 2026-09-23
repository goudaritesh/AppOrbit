import { Router } from 'express';
import {
  getDeveloperProfile,
  updateDeveloperProfile,
} from '../controllers/developerController.js';
import {
  createApp,
  getDeveloperApps,
  getDeveloperApp,
  updateApp,
  deleteApp,
  submitApp,
  archiveApp,
  restoreApp,
} from '../controllers/developerAppController.js';
import {
  getDeveloperOverview,
  getAppAnalytics,
} from '../modules/analytics/analytics.controller.js';
import { getDeveloperReviews } from '../modules/reviews/review.controller.js';
import {
  initializeUploadSession,
  uploadApkDirect,
  getVersions,
  getVersion,
  updateVersion,
  setCurrentVersion,
  deleteVersion,
  getDownloadUrl,
  downloadStream,
} from '../controllers/developerVersionController.js';
import {
  getSecurityReport,
  getSecurityStatus,
  requestSecurityReview,
} from '../controllers/developerSecurityController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { verifyAppOwnership } from '../middleware/ownershipMiddleware.js';
import { validate, updateDeveloperProfileValidation } from '../validators/authValidator.js';
import {
  createAppValidation,
  updateAppValidation,
  developerAppQueryValidation,
  stripRestrictedAppFields,
} from '../validators/developerAppValidator.js';
import {
  initUploadValidation,
  updateVersionValidation,
  stripRestrictedVersionFields,
} from '../validators/developerVersionValidator.js';
import {
  uploadIcon,
  uploadScreenshots as uploadScreenshotsMiddleware,
  uploadDemoVideo as uploadDemoVideoMiddleware,
  uploadApk as uploadApkMiddleware,
} from '../middleware/uploadMiddleware.js';
import {
  uploadAppIcon,
  uploadScreenshots as uploadScreenshotsHandler,
  uploadDemoVideo as uploadDemoVideoHandler,
  uploadAppApk,
  generateApkUploadUrl,
  confirmApkUpload,
  deleteScreenshot,
  deleteMedia,
} from '../controllers/uploadController.js';
import multer from 'multer';

const maxApkMb = parseInt(process.env.MAX_APK_SIZE_MB, 10) || 200;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxApkMb * 1024 * 1024,
  },
});

const router = Router();

/* ==========================================================================
   0. Signed Capability Token Download Route
   Allows direct browser/manager download via cryptographically signed token
   ========================================================================== */
router.get(
  '/apps/:appId/versions/:versionId/download',
  (req, res, next) => {
    // If request contains HMAC capability token, verify signature directly
    if (req.query.token) {
      return downloadStream(req, res, next);
    }
    // Otherwise require standard JWT authentication & ownership
    return protect(req, res, () => {
      authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN')(req, res, () => {
        verifyAppOwnership(req, res, () => {
          downloadStream(req, res, next);
        });
      });
    });
  }
);

// Strict RBAC Guard: Authenticated session + DEVELOPER (or ADMIN/SUPER_ADMIN) role required
router.use(protect);
router.use(authorizeRoles('DEVELOPER', 'ADMIN', 'SUPER_ADMIN'));

/* ==========================================================================
   1. Developer Profile Management
   ========================================================================== */
router.get('/profile', getDeveloperProfile);
router.patch('/profile', validate(updateDeveloperProfileValidation), updateDeveloperProfile);

/* ==========================================================================
   2. Developer Dashboard & Analytics
   ========================================================================== */
router.get('/analytics', getDeveloperOverview);
router.get('/apps/:appId/analytics', verifyAppOwnership, getAppAnalytics);

/* ==========================================================================
   3. Application Lifecycle & Management
   ========================================================================== */
router.post('/apps', stripRestrictedAppFields, validate(createAppValidation), createApp);
router.get('/apps', validate(developerAppQueryValidation), getDeveloperApps);
router.get('/apps/:appId', verifyAppOwnership, getDeveloperApp);
router.patch(
  '/apps/:appId',
  verifyAppOwnership,
  stripRestrictedAppFields,
  validate(updateAppValidation),
  updateApp
);
router.delete('/apps/:appId', verifyAppOwnership, deleteApp);

/* ==========================================================================
   4. Application State Transitions (Submit, Archive, Restore)
   ========================================================================== */
router.post('/apps/:appId/submit', verifyAppOwnership, submitApp);
router.post('/apps/:appId/archive', verifyAppOwnership, archiveApp);
router.post('/apps/:appId/restore', verifyAppOwnership, restoreApp);

/* ==========================================================================
   4.1 Sprint 3 App Media & APK Upload Endpoints
   ========================================================================== */
router.post('/apps/:appId/icon', verifyAppOwnership, uploadIcon, uploadAppIcon);
router.post(
  '/apps/:appId/screenshots',
  verifyAppOwnership,
  uploadScreenshotsMiddleware,
  uploadScreenshotsHandler
);
router.post(
  '/apps/:appId/demo-video',
  verifyAppOwnership,
  uploadDemoVideoMiddleware,
  uploadDemoVideoHandler
);
router.post(
  '/apps/:appId/apk',
  verifyAppOwnership,
  uploadApkMiddleware,
  uploadAppApk
);
router.post(
  '/apps/:appId/apk/upload-url',
  verifyAppOwnership,
  generateApkUploadUrl
);
router.post(
  '/apps/:appId/apk/confirm',
  verifyAppOwnership,
  confirmApkUpload
);
router.delete('/apps/:appId/screenshots/:screenshotId', verifyAppOwnership, deleteScreenshot);
router.delete('/apps/:appId/media/:mediaId', verifyAppOwnership, deleteMedia);

/* ==========================================================================
   5. APK Upload, Version Lifecycle & Releases (Phase 5)
   ========================================================================== */
router.post(
  '/apps/:appId/versions/upload-init',
  verifyAppOwnership,
  initUploadValidation,
  initializeUploadSession
);
router.post(
  '/apps/:appId/versions/upload',
  verifyAppOwnership,
  upload.single('apk'),
  stripRestrictedVersionFields,
  uploadApkDirect
);
router.get('/apps/:appId/versions', verifyAppOwnership, getVersions);
router.get('/apps/:appId/versions/:versionId', verifyAppOwnership, getVersion);
router.patch(
  '/apps/:appId/versions/:versionId',
  verifyAppOwnership,
  stripRestrictedVersionFields,
  updateVersionValidation,
  updateVersion
);
router.post(
  '/apps/:appId/versions/:versionId/set-current',
  verifyAppOwnership,
  setCurrentVersion
);
router.delete(
  '/apps/:appId/versions/:versionId',
  verifyAppOwnership,
  deleteVersion
);
router.get(
  '/apps/:appId/versions/:versionId/download-url',
  verifyAppOwnership,
  getDownloadUrl
);

/* ==========================================================================
   6. APK Security & Trust Verification (Phase 6)
   ========================================================================== */
router.get(
  '/apps/:appId/versions/:versionId/security',
  verifyAppOwnership,
  getSecurityReport
);
router.get(
  '/apps/:appId/versions/:versionId/security/status',
  verifyAppOwnership,
  getSecurityStatus
);
router.post(
  '/apps/:appId/versions/:versionId/security/request-review',
  verifyAppOwnership,
  requestSecurityReview
);

/* ==========================================================================
   7. Community Reviews (Sprint 7)
   ========================================================================== */
router.get('/reviews', getDeveloperReviews);

export default router;
