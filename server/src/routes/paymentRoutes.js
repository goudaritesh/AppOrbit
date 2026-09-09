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

const router = Router();

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/manual/submit', submitManualPayment);
router.get('/', getDeveloperPayments);
router.get('/:paymentId', getDeveloperPaymentById);
router.get('/:paymentId/receipt', getPaymentReceipt);

export default router;
