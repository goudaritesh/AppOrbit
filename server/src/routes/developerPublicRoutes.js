import { Router } from 'express';
import { getPublicDeveloperProfile } from '../controllers/developerPublicController.js';

const router = Router();

// Public Developer Profile Endpoints
router.get('/:username', getPublicDeveloperProfile);
router.get('/:id', getPublicDeveloperProfile);

export default router;
