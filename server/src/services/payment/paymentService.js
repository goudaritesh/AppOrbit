import crypto from 'crypto';
import { Payment } from '../../models/Payment.js';
import { PaymentReceipt } from '../../models/PaymentReceipt.js';
import { Invoice } from '../../models/Invoice.js';
import { WebhookEvent } from '../../models/WebhookEvent.js';
import { SubscriptionPlan } from '../../models/SubscriptionPlan.js';
import { User } from '../../models/User.js';
import { razorpayProvider } from './providers/razorpayProvider.js';
import { SubscriptionService } from '../subscription/subscriptionService.js';
import { NotificationDispatcher } from '../notification/notificationDispatcher.js';
import { emitToUser, emitToAdmin } from '../../realtime/socket.js';
import AppError from '../../utils/AppError.js';

/**
 * Enterprise Payment Service (Phase 8 Production Implementation)
 * Zero-trust payment order generation, cryptographic signature validation,
 * idempotent execution, receipt generation, and webhook ingestion.
 */
export class PaymentService {
  /**
   * Initialize a payment order for a developer subscription
   * (Amount is strictly retrieved from the database plan, never from client input)
   * @param {Object} params
   * @param {string} params.developerId
   * @param {string} params.planId
   * @param {string} [params.paymentMethod='RAZORPAY']
   */
  static async createPaymentOrder({ developerId, planId, paymentMethod = 'RAZORPAY' }) {
    const developer = await User.findById(developerId);
    if (!developer) throw new AppError('Developer account not found', 404);

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw new AppError('Invalid or inactive subscription plan', 400);

    if (plan.slug === 'free' || plan.price === 0) {
      // Free plan requires no payment order; activate directly
      const subscription = await SubscriptionService.activateSubscription({
        developerId,
        planId: plan._id,
      });
      return {
        isFreePlan: true,
        message: 'Free starter plan activated successfully',
        subscription,
      };
    }

    const internalPaymentId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    let providerOrderId = '';
    let checkoutData = {};

    if (paymentMethod === 'RAZORPAY') {
      const order = await razorpayProvider.createOrder({
        amount: plan.price,
        currency: plan.currency || 'INR',
        receipt: internalPaymentId,
        notes: {
          developerId: developer._id.toString(),
          planSlug: plan.slug,
          planName: plan.name,
        },
      });

      providerOrderId = order.orderId;
      checkoutData = {
        orderId: order.orderId,
        amount: order.amount, // In paise
        currency: order.currency,
        keyId: razorpayProvider.getPublicKeyId(),
        planName: plan.name,
        developerName: developer.name,
        developerEmail: developer.email,
      };
    }

    // Record internal payment in CREATED / PENDING state
    const payment = await Payment.create({
      paymentId: internalPaymentId,
      developer: developer._id,
      plan: plan._id,
      amount: plan.price,
      currency: plan.currency || 'INR',
      provider: paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'MANUAL_QR',
      method: paymentMethod,
      status: paymentMethod === 'RAZORPAY' ? 'CREATED' : 'PENDING',
      providerOrderId,
    });

    return {
      orderId: providerOrderId,
      amount: checkoutData.amount || Math.round(plan.price * 100),
      currency: plan.currency || 'INR',
      keyId: razorpayProvider.getPublicKeyId(),
      paymentReference: payment.paymentId,
      paymentId: payment.paymentId,
      paymentMethod,
      checkout: checkoutData,
      plan: {
        id: plan._id,
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        appLimit: plan.appLimit,
      },
    };
  }

  /**
   * Cryptographically verify client-submitted Razorpay payment credentials
   * @param {Object} params
   * @param {string} params.developerId
   * @param {string} [params.paymentId] - Internal paymentId
   * @param {string} [params.paymentReference]
   * @param {string} params.razorpayOrderId
   * @param {string} params.razorpayPaymentId
   * @param {string} params.razorpaySignature
   */
  static async verifyPayment({
    developerId,
    paymentId,
    paymentReference,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) {
    const ref = paymentId || paymentReference;
    // 1. Locate internal payment record
    const payment = await Payment.findOne({
      $or: [
        ...(ref ? [{ paymentId: ref }] : []),
        ...(razorpayOrderId ? [{ providerOrderId: razorpayOrderId }] : []),
      ],
      developer: developerId,
    }).populate('plan');

    if (!payment) {
      throw new AppError('Payment transaction record not found', 404);
    }

    // 2. Cryptographic Signature Verification
    const isValidSignature = razorpayProvider.verifyPaymentSignature({
      orderId: razorpayOrderId || payment.providerOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      payment.status = 'FAILED';
      payment.metadata = {
        failureReason: 'Cryptographic HMAC-SHA256 signature mismatch',
        attemptedAt: new Date(),
      };
      await payment.save();

      throw new AppError(
        'Payment signature verification failed. Untrusted payment payload.',
        400,
        'INVALID_PAYMENT_SIGNATURE'
      );
    }

    // 3. Idempotency Check: If already marked SUCCESS, return existing activation safely
    if (payment.status === 'SUCCESS') {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment already verified and processed.',
        payment,
      };
    }

    // 4. Mark payment as SUCCESS and activate subscription
    payment.status = 'SUCCESS';
    payment.providerPaymentId = razorpayPaymentId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpayOrderId = razorpayOrderId;
    payment.razorpaySignature = razorpaySignature;
    payment.verifiedAt = new Date();
    await payment.save();

    // 5. Activate developer subscription entitlements
    const subscription = await SubscriptionService.activateSubscription({
      developerId: payment.developer,
      planId: payment.plan._id,
      paymentId: payment._id,
      durationDays: 30,
    });

    payment.subscription = subscription._id;
    await payment.save();

    // 6. Generate official Receipt & Enterprise Invoice
    const receipt = await this.generateReceiptAndInvoice(payment);
    payment.receiptNumber = receipt.receiptNumber;
    await payment.save();

    // 7. Dispatch multi-channel notifications (WebSocket, FCM, Email)
    await NotificationDispatcher.dispatchPaymentSuccess({
      developerId: payment.developer,
      payment,
      receipt,
      planName: payment.plan?.name || 'Pro Tier',
    });

    // 8. Broadcast live update to administrative dashboard
    emitToAdmin('dashboard:update', {
      type: 'NEW_PAYMENT_VERIFIED',
      amount: payment.amount,
      plan: payment.plan?.name,
    });

    return {
      success: true,
      message: 'Payment verified and subscription activated successfully!',
      payment,
      subscription,
      receipt,
    };
  }

  /**
   * Submit manual QR / UPI transfer evidence for admin verification
   * @param {Object} params
   * @param {string} params.developerId
   * @param {string} params.planId
   * @param {string} params.transactionReference - UTR / Transaction ID
   * @param {string} [params.screenshotUrl]
   * @param {string} [params.notes]
   */
  static async submitManualPaymentProof({
    developerId,
    planId,
    transactionReference,
    screenshotUrl = '',
    notes = '',
  }) {
    if (!transactionReference || !transactionReference.trim()) {
      throw new AppError('Transaction Reference / UTR number is required', 400);
    }

    // Prevent duplicate submission of identical UTR
    const existing = await Payment.findOne({
      transactionReference: transactionReference.trim(),
      status: { $in: ['SUCCESS', 'MANUAL_REVIEW', 'PENDING'] },
    });

    if (existing) {
      throw new AppError(
        'A payment claim with this Transaction Reference / UTR has already been submitted',
        409
      );
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw new AppError('Invalid subscription plan', 400);

    const paymentId = `PAY_QR_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const payment = await Payment.create({
      paymentId,
      developer: developerId,
      plan: plan._id,
      amount: plan.price,
      currency: plan.currency || 'INR',
      provider: 'MANUAL_QR',
      method: 'MANUAL_QR',
      status: 'MANUAL_REVIEW',
      transactionReference: transactionReference.trim(),
      screenshotUrl,
      metadata: { developerNotes: notes },
    });

    // Notify admins via WebSocket
    emitToAdmin('dashboard:update', {
      type: 'MANUAL_PAYMENT_PENDING',
      paymentId: payment.paymentId,
      amount: payment.amount,
      utr: payment.transactionReference,
    });

    return payment;
  }

  /**
   * Process incoming Razorpay webhook event with signature and idempotency verification
   * @param {Object} params
   * @param {string} params.rawBody
   * @param {string} params.signature
   * @param {Object} params.payload
   */
  static async processRazorpayWebhook({ rawBody, signature, payload }) {
    // 1. Verify Webhook Signature
    const isValid = razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    const eventId = payload?.event_id || payload?.id || `evt_${Date.now()}`;
    const eventType = payload?.event || 'unknown';

    // 2. Idempotency Check: Prevent duplicate webhook execution
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      return { duplicate: true, message: 'Webhook event already processed' };
    }

    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    const webhookLog = await WebhookEvent.create({
      provider: 'RAZORPAY',
      eventId,
      eventType,
      payloadHash,
      payload,
      status: 'RECEIVED',
    });

    // 3. Handle Supported Events
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const orderId = entity?.order_id || entity?.id;
      const paymentId = entity?.id;

      if (orderId) {
        const payment = await Payment.findOne({ providerOrderId: orderId });
        if (payment && payment.status !== 'SUCCESS') {
          payment.status = 'SUCCESS';
          payment.providerPaymentId = paymentId;
          payment.verifiedAt = new Date();
          await payment.save();

          const subscription = await SubscriptionService.activateSubscription({
            developerId: payment.developer,
            planId: payment.plan,
            paymentId: payment._id,
          });
          payment.subscription = subscription._id;
          await payment.save();

          await this.generateReceiptAndInvoice(payment);
        }
      }
    } else if (eventType === 'payment.failed') {
      const entity = payload?.payload?.payment?.entity;
      const orderId = entity?.order_id;
      if (orderId) {
        await Payment.findOneAndUpdate(
          { providerOrderId: orderId, status: { $ne: 'SUCCESS' } },
          { $set: { status: 'FAILED' } }
        );
      }
    }

    webhookLog.status = 'PROCESSED';
    webhookLog.processedAt = new Date();
    await webhookLog.save();

    return { success: true, eventId, eventType };
  }

  /**
   * Generate official unique receipt and invoice records for a successful payment
   * @param {Payment} payment
   */
  static async generateReceiptAndInvoice(payment) {
    const developer = await User.findById(payment.developer);
    const plan = await SubscriptionPlan.findById(payment.plan);

    // Generate unique sequential receipt number: AB-YYYY-NNNNNN
    const receiptNumber = await PaymentReceipt.generateReceiptNumber();

    const receipt = await PaymentReceipt.create({
      receiptNumber,
      payment: payment._id,
      developer: payment.developer,
      plan: payment.plan,
      planName: plan?.name || 'Pro Plan',
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.method || 'RAZORPAY',
      transactionReference: payment.providerPaymentId || payment.transactionReference || '',
      providerPaymentId: payment.providerPaymentId || payment.transactionReference || '',
      billingDetails: {
        name: developer?.name || 'AppOrbit Developer',
        email: developer?.email || '',
      },
    });

    // Generate matching enterprise invoice
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    await Invoice.create({
      invoiceNumber,
      developer: payment.developer,
      payment: payment._id,
      subscription: payment.subscription,
      amount: payment.amount,
      subtotal: payment.amount,
      currency: payment.currency,
      status: 'PAID',
      paidAt: new Date(),
      lineItems: [
        {
          description: `${plan?.name || 'Subscription'} - Monthly Platform Entitlement`,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount,
        },
      ],
      billingDetails: {
        name: developer?.name,
        email: developer?.email,
      },
    });

    return receipt;
  }
}

export default PaymentService;
