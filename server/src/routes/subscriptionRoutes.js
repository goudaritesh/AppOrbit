import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPublicPlans,
  getDeveloperSubscription,
  getDeveloperUsage,
  cancelSubscription,
  changePlan,
} from '../controllers/subscription/subscriptionController.js';

const router = Router();

// Public plan discovery
router.get('/plans', getPublicPlans);

// Protected developer subscription management
router.use(protect);
router.get('/', getDeveloperSubscription);
router.get('/usage', getDeveloperUsage);
router.post('/cancel', cancelSubscription);
router.post('/change-plan', changePlan);

export default router;
