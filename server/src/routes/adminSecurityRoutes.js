import { Router } from 'express';
import {
  getSecurityReports,
  getSecurityReportById,
  submitReviewDecision,
  triggerRescan,
} from '../controllers/adminSecurityController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Strict RBAC: Requires authenticated ADMIN or SUPER_ADMIN
router.use(protect);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

/**
 * Platform Security Reports & Moderation Endpoints
 */
router.get('/reports', getSecurityReports);
router.get('/reports/:reportId', getSecurityReportById);
router.post('/reports/:reportId/review', submitReviewDecision);
router.post('/apps/:appId/versions/:versionId/rescan', triggerRescan);

export default router;
