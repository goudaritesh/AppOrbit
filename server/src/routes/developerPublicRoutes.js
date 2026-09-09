import { Router } from 'express';
import { getPublicDeveloperProfile } from '../controllers/developerPublicController.js';

const router = Router();

// Public Developer Profile Endpoint
router.get('/:id', getPublicDeveloperProfile);

export default router;
