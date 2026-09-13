import { Payment } from '../../models/Payment.js';
import { Subscription } from '../../models/Subscription.js';
import { SubscriptionPlan } from '../../models/SubscriptionPlan.js';
import { PaymentReceipt } from '../../models/PaymentReceipt.js';
import { Invoice } from '../../models/Invoice.js';
import { PaymentService } from '../../services/payment/paymentService.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';
import { NotificationDispatcher } from '../../services/notification/notificationDispatcher.js';
import ActivityLogService from '../../services/activityLogService.js';
import EventTrackingService from '../../services/eventTrackingService.js';

/**
 * Admin Payment Management Controller (Phase 7 Production Implementation)
 * Handles payment transaction ledgers, manual QR verification, and subscription provisioning.
 */

/**
 * GET /api/admin/payments
 * Query payment transactions with server-side pagination, status, and method filters
 */
export const getAdminPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, method, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (method && method !== 'ALL') filter.method = method;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ paymentId: regex }, { transactionReference: regex }];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('developer', 'name email profileImage')
        .populate('plan', 'name slug price')
        .populate('verifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
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
 * GET /api/admin/payments/:paymentId
 * Single payment transaction detail
 */
export const getAdminPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('developer', 'name email profileImage')
      .populate('plan')
      .populate('verifiedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
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
 * POST /api/admin/payments/:paymentId/verify
 * Approve or reject manual QR / pending payment
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const rawDecision = (req.body.decision || req.body.status || '').toUpperCase();
    const reason = req.body.reason || '';

    let decision = 'APPROVED';
    if (['REJECTED', 'FAILED'].includes(rawDecision)) {
      decision = 'REJECTED';
    } else if (['APPROVED', 'PAID', 'SUCCESS'].includes(rawDecision)) {
      decision = 'APPROVED';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Decision or status must be APPROVED/PAID or REJECTED/FAILED.',
      });
    }

    if (decision === 'REJECTED' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory.',
      });
    }

    const targetId = req.params.paymentId || req.params.id;
    const payment = await Payment.findById(targetId).populate('plan');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Prevent duplicate approval or state collision
    if (payment.status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been approved and processed.',
      });
    }
    if (payment.status === 'FAILED' && decision === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been rejected.',
      });
    }

    const previousStatus = payment.status;

    if (decision === 'APPROVED') {
      payment.status = 'SUCCESS';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();

      // Automatically activate or update developer subscription
      const plan = payment.plan || (await SubscriptionPlan.findById(payment.plan));
      if (plan) {
        // Cancel prior active subscriptions
        await Subscription.updateMany(
          { developer: payment.developer, status: 'ACTIVE' },
          { $set: { status: 'CANCELLED' } }
        );

        const durationDays = plan.billingPeriod === 'ANNUAL' ? 365 : 30;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const subscription = await Subscription.create({
          developer: payment.developer,
          plan: plan._id,
          planSlug: plan.slug,
          status: 'ACTIVE',
          appsLimit: plan.appLimit || plan.applicationLimit || 5,
          applicationLimit: plan.appLimit || plan.applicationLimit || 5,
          applicationsUsed: 0,
          startDate: new Date(),
          startedAt: new Date(),
          endDate,
          expiresAt: endDate,
          grantedBy: req.user._id,
          adminNotes: `Activated via manual payment verification (${payment.paymentId}).`,
        });

        payment.subscription = subscription._id;
        await payment.save();

        // Generate formal PaymentReceipt and Invoice via PaymentService
        const receipt = await PaymentService.generateReceiptAndInvoice(payment);
        payment.receiptNumber = receipt.receiptNumber;

        // Real-time notification to developer
        await NotificationDispatcher.dispatchNotification({
          recipientId: payment.developer,
          type: 'PAYMENT_SUCCESS',
          title: 'Manual Payment Verified & Approved',
          message: `Your payment of ₹${payment.amount} for the ${plan.name} plan has been verified. Your subscription is now ACTIVE.`,
          priority: 'HIGH',
          data: {
            paymentId: payment._id,
            receiptNumber: receipt.receiptNumber,
            planSlug: plan.slug,
          },
        });
      }
    } else {
      payment.status = 'FAILED';
      payment.rejectionReason = reason.trim();
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();

      // Dispatch failure notification
      await NotificationDispatcher.dispatchNotification({
        recipientId: payment.developer,
        type: 'PAYMENT_FAILED',
        title: 'Manual Payment Rejected',
        message: `Your manual payment submission was rejected: ${reason.trim()}`,
        priority: 'HIGH',
        data: {
          paymentId: payment._id,
          reason: reason.trim(),
        },
      });
    }

    await payment.save();

    // Log immutable audit event
    await AuditLogService.log({
      req,
      action: decision === 'APPROVED' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      resourceType: 'PAYMENT',
      resourceId: payment._id,
      reason: reason.trim(),
      previousState: { status: previousStatus },
      newState: { status: payment.status },
      severity: decision === 'APPROVED' ? 'INFO' : 'WARNING',
    });

    // Sprint 10 Activity Logging
    ActivityLogService.logActivity({
      actorId: req.user._id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action: decision === 'APPROVED'
        ? ActivityLogService.ACTIONS.ADMIN_APPROVED_PAYMENT
        : ActivityLogService.ACTIONS.ADMIN_REJECTED_PAYMENT,
      resourceType: 'PAYMENT',
      resourceId: payment._id,
      reason: reason.trim() || 'Manual payment review',
      metadata: { amount: payment.amount, planId: payment.plan?._id || payment.plan },
      ipAddress: req.ip,
    }).catch(() => {});

    if (decision === 'APPROVED') {
      EventTrackingService.trackPaymentSuccess(payment._id, {
        userId: payment.developer,
        planId: payment.plan?._id || payment.plan,
        amount: payment.amount,
        currency: payment.currency || 'INR',
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Payment has been ${decision === 'APPROVED' ? 'verified and approved' : 'rejected'}.`,
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
};

export const approvePayment = async (req, res, next) => {
  req.body.decision = 'APPROVED';
  return verifyPayment(req, res, next);
};

export const rejectPayment = async (req, res, next) => {
  req.body.decision = 'REJECTED';
  return verifyPayment(req, res, next);
};

export default {
  getAdminPayments,
  getAdminPaymentById,
  verifyPayment,
  approvePayment,
  rejectPayment,
};
