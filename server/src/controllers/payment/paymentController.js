import { Payment } from '../../models/Payment.js';
import { PaymentReceipt } from '../../models/PaymentReceipt.js';
import { PaymentService } from '../../services/payment/paymentService.js';
import AppError from '../../utils/AppError.js';

/**
 * Payment Controller (Phase 8 Production Implementation)
 * Zero-trust payment order creation, cryptographic verification, manual proof submissions, and receipts.
 */

/**
 * POST /api/payments/create-order
 * Initialize a new Razorpay or Manual QR order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const { planId, paymentMethod = 'RAZORPAY' } = req.body;

    if (!planId) {
      return next(new AppError('Plan identifier is required', 400));
    }

    const order = await PaymentService.createPaymentOrder({
      developerId,
      planId,
      paymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order initialized successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and activate subscription
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const {
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentReference,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_signature) {
      return next(
        new AppError('Missing required payment credentials (paymentId, signature)', 400)
      );
    }

    const result = await PaymentService.verifyPayment({
      developerId,
      paymentId: paymentId || paymentReference,
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/manual/submit
 * Submit developer manual QR / UPI transfer reference for review
 */
export const submitManualPayment = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const { planId, transactionId, screenshotUrl, notes } = req.body;

    if (!planId || !transactionId) {
      return next(new AppError('Plan ID and Transaction ID (UTR) are required.', 400));
    }

    const payment = await PaymentService.submitManualPaymentProof({
      developerId,
      planId,
      transactionReference: transactionId,
      screenshotUrl,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Manual payment submitted successfully. Your payment is under administrative review.',
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/payments
 * Query authenticated developer's payment history
 */
export const getDeveloperPayments = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ developer: developerId })
        .populate('plan', 'name slug price currency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ developer: developerId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/payments/:paymentId
 * Get specific payment details
 */
export const getDeveloperPaymentById = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const payment = await Payment.findOne({
      $or: [{ _id: req.params.paymentId }, { paymentId: req.params.paymentId }],
      developer: developerId,
    }).populate('plan');

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/developer/payments/:paymentId/receipt
 * Retrieve printable receipt for a successful transaction
 */
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const payment = await Payment.findOne({
      $or: [{ _id: req.params.paymentId }, { paymentId: req.params.paymentId }],
      developer: developerId,
    });

    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    let receipt = await PaymentReceipt.findOne({ payment: payment._id });
    if (!receipt && payment.status === 'SUCCESS') {
      receipt = await PaymentService.generateReceiptAndInvoice(payment);
    }

    if (!receipt) {
      return next(new AppError('Receipt not available for unverified or pending transactions', 400));
    }

    return res.status(200).json({
      success: true,
      data: { receipt },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  submitManualPayment,
  getDeveloperPayments,
  getDeveloperPaymentById,
  getPaymentReceipt,
};
