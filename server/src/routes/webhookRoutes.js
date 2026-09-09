import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/payment/webhookController.js';

const router = Router();

// Public webhook endpoint for Razorpay servers
router.post('/razorpay', handleRazorpayWebhook);

export default router;
