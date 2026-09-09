import { Router } from 'express';
import { getHealth, getLiveness, getReadiness } from '../controllers/healthController.js';

const router = Router();

// Base health
router.get('/', getHealth);

// Kubernetes / Container orchestrator probes
router.get('/live', getLiveness);
router.get('/ready', getReadiness);

export default router;
