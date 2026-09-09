import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';
import { io as ClientIO } from 'socket.io-client';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { PaymentReceipt } from '../models/PaymentReceipt.js';
import { Invoice } from '../models/Invoice.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Notification } from '../models/Notification.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { SubscriptionLimitService } from '../services/admin/subscriptionLimitService.js';
import { SubscriptionExpiryJob } from '../jobs/subscriptionExpiryJob.js';
import { SubscriptionUsageResetJob } from '../jobs/subscriptionUsageResetJob.js';
import { razorpayProvider } from '../services/payment/providers/razorpayProvider.js';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runPhase8Tests() {
  console.log('===============================================================');
  console.log('   APPORBIT — PHASE 8 AUTOMATED E2E TEST & AUDIT SUITE         ');
  console.log('   Subscriptions, Payments, Notifications & Real-Time          ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await connectDB();

    // ==============================================================
    // 1. AUTHENTICATION SETUP
    // ==============================================================
    console.log('\n--- 1. Authenticating Roles (Developer, Admin, Public User) ---');

    // 1.1 Developer Login
    const devLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' }),
    });
    const devLogin = await devLoginRes.json();
    assert(devLogin.success && devLogin.data?.accessToken, 'Developer dev.aura authenticated');
    const devToken = devLogin.data.accessToken;
    const developerId = devLogin.data.user.id || devLogin.data.user._id;

    // 1.2 Admin Login
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.success && adminLogin.data?.accessToken, 'Master Admin authenticated');
    const adminToken = adminLogin.data.accessToken;

    // 1.3 Normal User Login (for RBAC & isolation tests)
    let normalUser = await User.findOne({ email: 'public.testuser@apporbit.io' });
    if (!normalUser) {
      normalUser = await User.create({
        name: 'Test Public User',
        email: 'public.testuser@apporbit.io',
        password: 'Password123!',
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
    } else {
      normalUser.accountStatus = 'ACTIVE';
      normalUser.emailVerified = true;
      normalUser.password = 'Password123!';
      await normalUser.save();
    }
    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'public.testuser@apporbit.io', password: 'Password123!' }),
    });
    const userLogin = await userLoginRes.json();
    assert(userLogin.success && userLogin.data?.accessToken, 'Normal User authenticated');
    const userToken = userLogin.data.accessToken;
    const userId = userLogin.data.user.id || userLogin.data.user._id;

    // ==============================================================
    // 2. SUBSCRIPTION PLANS & CATALOG
    // ==============================================================
    console.log('\n--- 2. Subscription Plans Catalog ---');

    const plansRes = await fetch(`${API_URL}/subscription/plans`);
    const plansData = await plansRes.json();
    assert(plansData.success && Array.isArray(plansData.data?.plans), 'GET /api/subscription/plans returned plans list');

    const plans = plansData.data.plans;
    const freePlan = plans.find((p) => p.slug === 'free');
    const silverPlan = plans.find((p) => p.slug === 'silver');
    const goldPlan = plans.find((p) => p.slug === 'gold');
    const diamondPlan = plans.find((p) => p.slug === 'diamond');

    assert(freePlan && freePlan.price === 0, 'Free plan exists with price ₹0');
    assert(silverPlan && silverPlan.price === 399, 'Silver plan exists with price ₹399');
    assert(goldPlan && goldPlan.price === 599, 'Gold plan exists with price ₹599');
    assert(diamondPlan && diamondPlan.price === 999, 'Diamond plan exists with configurable price ₹999');

    // ==============================================================
    // 3. DEVELOPER USAGE QUOTA & ATOMIC LIMIT ENFORCEMENT
    // ==============================================================
    console.log('\n--- 3. Usage Quota Telemetry & Atomic Slots ---');

    const usageRes = await fetch(`${API_URL}/developer/subscription/usage`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const usageData = await usageRes.json();
    assert(usageData.success && usageData.data?.usage, 'GET /api/developer/subscription/usage returned quota details');
    const initialUsage = usageData.data.usage;
    assert(typeof initialUsage.remainingApps === 'number', 'Telemetry includes remainingApps count');

    // Test Atomic Slot Reservation
    console.log('Testing safe limit reservation & rollback...');
    const reservation = await SubscriptionLimitService.reserveAppSlot(developerId);
    assert(reservation.success, 'Atomic limit reservation succeeded when slot available');

    // Release slot
    const releaseResult = await SubscriptionLimitService.releaseAppSlot(developerId);
    assert(
      releaseResult.success &&
        releaseResult.subscription.applicationsUsed ===
          reservation.subscription.applicationsUsed - 1,
      'Atomic rollback accurately decremented applicationsUsed slot'
    );

    // ==============================================================
    // 4. ZERO-TRUST PAYMENT ORDERS & SIGNATURE VERIFICATION
    // ==============================================================
    console.log('\n--- 4. Zero-Trust Razorpay Orders & Verification ---');

    // 4.1 Client amount manipulation attempt
    console.log('Testing client amount tampering defense...');
    const orderRes = await fetch(`${API_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        planId: silverPlan._id,
        amount: 1, // Tamper attempt!
      }),
    });
    const orderData = await orderRes.json();
    assert(orderData.success && orderData.data?.orderId, 'Order created successfully');
    assert(
      orderData.data.amount === silverPlan.price * 100,
      `Backend strictly enforced plan price (₹${silverPlan.price} = ${silverPlan.price * 100} paise), ignoring client amount ₹1`
    );
    assert(!orderData.data.keySecret, 'Razorpay secret key is NEVER leaked in response');

    const createdOrder = orderData.data;

    // 4.2 Signature Verification with INVALID signature
    console.log('Testing invalid signature rejection...');
    const fakeSignatureRes = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        razorpay_payment_id: 'pay_test_tampered_123',
        razorpay_order_id: createdOrder.orderId,
        razorpay_signature: 'invalid_forged_signature_hex_1234567890abcdef',
        paymentReference: createdOrder.paymentReference,
      }),
    });
    const fakeSigData = await fakeSignatureRes.json();
    assert(
      !fakeSigData.success && fakeSignatureRes.status === 400,
      'Invalid HMAC SHA-256 signature rejected with 400 Bad Request'
    );

    // 4.3 Signature Verification with VALID HMAC signature
    console.log('Testing legitimate HMAC signature verification...');
    const realPaymentId = `pay_valid_${Date.now()}`;
    const validSignature = razorpayProvider.generateTestSignature(createdOrder.orderId, realPaymentId);

    const validVerifyRes = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        razorpay_payment_id: realPaymentId,
        razorpay_order_id: createdOrder.orderId,
        razorpay_signature: validSignature,
        paymentReference: createdOrder.paymentReference,
      }),
    });
    const validVerifyData = await validVerifyRes.json();
    assert(validVerifyData.success, 'Valid signature verified, payment marked SUCCESS and subscription ACTIVATED');

    // 4.4 Verification Idempotency: Re-submitting the exact same payment verification
    console.log('Testing verification idempotency...');
    const reVerifyRes = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        razorpay_payment_id: realPaymentId,
        razorpay_order_id: createdOrder.orderId,
        razorpay_signature: validSignature,
        paymentReference: createdOrder.paymentReference,
      }),
    });
    const reVerifyData = await reVerifyRes.json();
    assert(reVerifyData.success, 'Idempotent re-verification returned success safely without duplicate activation');

    // Verify Payment Receipt and Invoice generated
    const receiptDoc = await PaymentReceipt.findOne({ providerPaymentId: realPaymentId });
    assert(receiptDoc && receiptDoc.receiptNumber.startsWith('AB-'), `Unique PaymentReceipt generated: ${receiptDoc?.receiptNumber}`);

    const invoiceDoc = await Invoice.findOne({ payment: receiptDoc.payment });
    assert(invoiceDoc && invoiceDoc.status === 'PAID', `Formal Invoice generated: ${invoiceDoc?.invoiceNumber}`);

    // Verify Active Subscription status
    const activeSub = await Subscription.findOne({ developer: developerId, status: 'ACTIVE' });
    assert(activeSub && activeSub.planSlug === 'silver', 'Developer subscription is now ACTIVE on Silver plan');

    // ==============================================================
    // 5. RAZORPAY WEBHOOKS & DEDUPLICATION
    // ==============================================================
    console.log('\n--- 5. Webhook Security & Idempotency ---');

    const webhookSecret = razorpayProvider.webhookSecret;
    const webhookEventId = `evt_test_${Date.now()}`;
    const webhookPayload = {
      entity: 'event',
      account_id: 'acc_apporbit',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_${Date.now()}`,
            order_id: createdOrder.orderId,
            status: 'captured',
            amount: 39900,
            currency: 'INR',
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    const rawWebhookBody = JSON.stringify(webhookPayload);
    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawWebhookBody)
      .digest('hex');

    // 5.1 Invalid webhook signature
    const badWebhookRes = await fetch(`${API_URL}/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature_hex',
      },
      body: rawWebhookBody,
    });
    assert(
      !badWebhookRes.ok && badWebhookRes.status === 400,
      'Webhook with invalid signature rejected with 400'
    );

    // 5.2 Valid webhook delivery
    const goodWebhookRes = await fetch(`${API_URL}/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
      },
      body: rawWebhookBody,
    });
    const goodWebhookData = await goodWebhookRes.json();
    assert(goodWebhookRes.ok && goodWebhookData.status === 'ok', 'Webhook verified and processed successfully');

    // 5.3 Duplicate webhook delivery (Idempotency)
    const dupWebhookRes = await fetch(`${API_URL}/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
      },
      body: rawWebhookBody,
    });
    const dupWebhookData = await dupWebhookRes.json();
    assert(dupWebhookRes.ok && dupWebhookData.status === 'ok', 'Duplicate webhook acknowledged safely without errors');

    // ==============================================================
    // 6. MANUAL QR PAYMENT & ADMIN VERIFICATION
    // ==============================================================
    console.log('\n--- 6. Manual QR Payment & Admin Moderation ---');

    const manualTxId = `UTR${Date.now()}`;
    const manualSubRes = await fetch(`${API_URL}/payments/manual/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        planId: goldPlan._id,
        transactionId: manualTxId,
        amount: goldPlan.price,
      }),
    });
    const manualSubData = await manualSubRes.json();
    assert(manualSubData.success && manualSubData.data?.payment, 'Manual payment claim submitted');
    const manualPayment = manualSubData.data.payment;
    assert(manualPayment.status === 'MANUAL_REVIEW', 'Manual payment initialized with MANUAL_REVIEW status');

    // Test duplicate transaction reference submission
    const dupManualRes = await fetch(`${API_URL}/payments/manual/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        planId: goldPlan._id,
        transactionId: manualTxId,
        amount: goldPlan.price,
      }),
    });
    const dupManualData = await dupManualRes.json();
    assert(!dupManualData.success && (dupManualRes.status === 400 || dupManualRes.status === 409), 'Duplicate UTR reference rejected with 400/409 Conflict');

    // Admin verifies and approves the manual payment
    console.log('Admin reviewing manual payment...');
    const adminVerifyRes = await fetch(`${API_URL}/admin/payments/${manualPayment._id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    const adminVerifyData = await adminVerifyRes.json();
    if (!adminVerifyData.success) {
      console.log('ADMIN VERIFY ERROR:', adminVerifyRes.status, adminVerifyData);
    }
    assert(adminVerifyData.success, 'Admin approved manual payment');

    const updatedSub = await Subscription.findOne({ developer: developerId, status: 'ACTIVE' });
    assert(updatedSub && updatedSub.planSlug === 'gold', 'Subscription transitioned to Gold plan upon admin approval');

    // ==============================================================
    // 7. NOTIFICATIONS SYSTEM & ACCESS CONTROL
    // ==============================================================
    console.log('\n--- 7. Notifications Engine & Authorization ---');

    // 7.1 Fetch notifications for developer
    const notifRes = await fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const notifData = await notifRes.json();
    assert(notifData.success && Array.isArray(notifData.data?.notifications), 'Developer notifications retrieved');
    const devNotifs = notifData.data.notifications;
    assert(devNotifs.length > 0, 'Notifications created automatically from payment clearance');

    const firstNotif = devNotifs[0];

    // 7.2 Unauthorized user cannot access developer's notification
    const unauthDeleteRes = await fetch(`${API_URL}/notifications/${firstNotif._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      !unauthDeleteRes.ok && unauthDeleteRes.status === 404,
      'Cross-user notification deletion blocked (404 Not Found)'
    );

    // 7.3 Mark notification as read
    const markReadRes = await fetch(`${API_URL}/notifications/${firstNotif._id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const markReadData = await markReadRes.json();
    assert(markReadData.success, 'Mark single notification as read succeeded');

    // 7.4 Mark all read
    const markAllReadRes = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const markAllReadData = await markAllReadRes.json();
    assert(markAllReadData.success, 'Mark all notifications as read succeeded');

    // 7.5 Unread count is now 0
    const unreadRes = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const unreadData = await unreadRes.json();
    assert(unreadData.data?.unreadCount === 0, 'Unread notification count correctly reports 0');

    // ==============================================================
    // 8. NOTIFICATION PREFERENCES & DEVICE TOKENS
    // ==============================================================
    console.log('\n--- 8. Notification Preferences & FCM Tokens ---');

    // Update preferences
    const updatePrefRes = await fetch(`${API_URL}/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        email: { enabled: true },
        push: { enabled: true },
        application: true,
        payment: true,
        subscription: true,
        support: true,
      }),
    });
    const updatePrefData = await updatePrefRes.json();
    assert(updatePrefData.success, 'Notification preferences updated');

    // Register FCM device token
    const testFcmToken = `fcm_device_${Date.now()}`;
    const regTokenRes = await fetch(`${API_URL}/notifications/device-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        token: testFcmToken,
        platform: 'WEB',
        deviceInfo: { browser: 'Chrome 120' },
      }),
    });
    const regTokenData = await regTokenRes.json();
    assert(regTokenData.success, 'FCM Web Push token registered');

    // Unregister FCM device token
    const unregTokenRes = await fetch(`${API_URL}/notifications/device-tokens/${encodeURIComponent(testFcmToken)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const unregTokenData = await unregTokenRes.json();
    assert(unregTokenData.success, 'FCM Web Push token unregistered cleanly');

    // ==============================================================
    // 9. REAL-TIME WEBSOCKET SECURITY & ROOM ISOLATION
    // ==============================================================
    console.log('\n--- 9. WebSocket Authentication & Room Isolation ---');

    // 9.1 Connection without authentication rejected
    const unauthSocket = ClientIO(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });

    const unauthConnPromise = new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => {
        resolve({ error: err.message });
      });
      unauthSocket.on('connect', () => {
        resolve({ connected: true });
      });
    });
    unauthSocket.connect();
    const unauthResult = await unauthConnPromise;
    assert(
      unauthResult.error && unauthResult.error.includes('Authentication error'),
      'WebSocket connection without JWT rejected with Authentication error'
    );
    unauthSocket.disconnect();

    // 9.2 Connection with valid developer JWT accepted
    const devSocket = ClientIO(SOCKET_URL, {
      auth: { token: devToken },
      transports: ['websocket'],
      autoConnect: false,
    });

    const devConnPromise = new Promise((resolve) => {
      devSocket.on('connect', () => {
        resolve(true);
      });
      devSocket.on('connect_error', (err) => {
        resolve(false);
      });
    });
    devSocket.connect();
    const devConnected = await devConnPromise;
    assert(devConnected, 'Developer WebSocket successfully connected and authenticated via JWT');
    devSocket.disconnect();

    // ==============================================================
    // 10. BACKGROUND JOBS: EXPIRY & USAGE RESET
    // ==============================================================
    console.log('\n--- 10. Scheduled Background Workers ---');

    // Test Expiry Job
    const expiryJobResult = await SubscriptionExpiryJob.processExpiredSubscriptions();
    assert(expiryJobResult.success, 'SubscriptionExpiryJob executed without errors');

    // Test Usage Reset Job
    const usageResetResult = await SubscriptionUsageResetJob.processUsageResets();
    assert(usageResetResult.success, 'SubscriptionUsageResetJob executed without errors');

    // ==============================================================
    // SUMMARY
    // ==============================================================
    console.log('\n===============================================================');
    console.log(` PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🌟 ALL PHASE 8 TEST SUITES COMPLETED WITH 100% PASS RATE!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error in Phase 8 test suite:', err);
    process.exit(1);
  }
}

runPhase8Tests();
