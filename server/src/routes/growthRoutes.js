import { Router } from 'express';
import { getGrowthAnalytics } from '../controllers/growthController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Admin Growth & Acquisition Telemetry
router.get('/analytics', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getGrowthAnalytics);

export default router;
