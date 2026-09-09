import { PaymentService } from '../../services/payment/paymentService.js';

/**
 * Webhook Controller (Phase 8 Production Implementation)
 * Ingests and processes asynchronous Razorpay notifications with signature validation.
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const result = await PaymentService.processRazorpayWebhook({
      rawBody,
      signature,
      payload: req.body,
    });

    return res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    // Still return 400 with controlled error message
    return res.status(400).json({
      success: false,
      message: err.message || 'Webhook processing failed',
    });
  }
};

export default {
  handleRazorpayWebhook,
};
