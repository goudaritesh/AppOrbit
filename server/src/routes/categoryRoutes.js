import { Router } from 'express';
import { getCategories, getCategoryApps } from '../controllers/categoryController.js';

const router = Router();

// Public Category Discovery Endpoints
router.get('/', getCategories);
router.get('/:slug', getCategoryApps);
router.get('/:slug/apps', getCategoryApps);

export default router;
