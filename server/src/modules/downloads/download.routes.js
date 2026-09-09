import { Router } from 'express';
import {
  initiateDownload,
  streamDownloadFile,
  completeDownload,
  getUserDownloads,
} from './download.controller.js';
import { protect, optionalAuth } from '../../middleware/authMiddleware.js';

const router = Router();

/* ==========================================
   DOWNLOAD ROUTING (/api/downloads)
   ========================================== */

// Download file stream with session validation
router.get('/file/:sessionToken', streamDownloadFile);

// Complete download notifications
router.post('/complete', optionalAuth, completeDownload);
router.post('/:sessionId/complete', optionalAuth, completeDownload);

export default router;

/* ==========================================
   APP-NESTED DOWNLOAD HELPER
   ========================================== */
export const appDownloadRouter = Router({ mergeParams: true });
appDownloadRouter.post('/', optionalAuth, initiateDownload);

/* ==========================================
   USER DOWNLOAD HISTORY ROUTER (/api/me/downloads)
   ========================================== */
export const meDownloadsRouter = Router();
meDownloadsRouter.get('/', protect, getUserDownloads);
