import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createPaymentOrder,
  verifyPayment,
  submitManualPayment,
  getDeveloperPayments,
  getDeveloperPaymentById,
  getPaymentReceipt,
} from '../controllers/payment/paymentController.js';
import { handleRazorpayWebhook } from '../controllers/payment/webhookController.js';

const router = Router();

// Public webhook endpoint for Razorpay servers
router.post('/webhook', handleRazorpayWebhook);

// Protected developer endpoints
router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/manual', submitManualPayment);
router.post('/manual/submit', submitManualPayment);
router.get('/', getDeveloperPayments);
router.get('/:paymentId', getDeveloperPaymentById);
router.get('/:paymentId/receipt', getPaymentReceipt);

export default router;
