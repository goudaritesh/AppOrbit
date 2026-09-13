import { Router } from 'express';
import {
  getBetaAnalytics,
  getIncidents,
  createIncident,
  updateIncident,
} from '../controllers/betaController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All Beta Admin Routes require ADMIN or SUPER_ADMIN
router.use(protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.get('/analytics', getBetaAnalytics);
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.patch('/incidents/:id', updateIncident);

export default router;
