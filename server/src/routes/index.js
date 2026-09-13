import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import developerRoutes from './developerRoutes.js';
import appRoutes from './appRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import developerPublicRoutes from './developerPublicRoutes.js';
import adminSecurityRoutes from './adminSecurityRoutes.js';
import adminRoutes from './adminRoutes.js';
import doubtRoutes from './doubtRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import { getPublicPlans } from '../controllers/subscription/subscriptionController.js';
import paymentRoutes from './paymentRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import notificationRoutes from './notificationRoutes.js';

// Phase 9 Modules
import reviewRoutes from '../modules/reviews/review.routes.js';
import downloadRoutes, { meDownloadsRouter } from '../modules/downloads/download.routes.js';
import searchRoutes from '../modules/search/search.routes.js';
import analyticsRoutes, {
  developerAnalyticsRouter,
  adminAnalyticsRouter,
} from '../modules/analytics/analytics.routes.js';

// Sprint 12 Beta Program & User Testing Modules
import feedbackRoutes from './feedbackRoutes.js';
import bugRoutes from './bugRoutes.js';
import betaRoutes from './betaRoutes.js';

// Sprint 13 Public Beta, Growth & Launch Modules
import waitlistRoutes from './waitlistRoutes.js';
import referralRoutes from './referralRoutes.js';
import growthRoutes from './growthRoutes.js';

const router = Router();

// Health Check API
router.use('/health', healthRoutes);

// Phase 2 Authentication & Identity
router.use('/auth', authRoutes);

// Phase 2 Developer Profile & Workspace (Protected)
router.use('/developer', developerRoutes);

// Phase 8 Developer Subscription & Payments aliases
router.use('/developer/subscription', subscriptionRoutes);
router.use('/developer/payments', paymentRoutes);

// Phase 9 Developer Analytics
router.use('/developer', developerAnalyticsRouter);

// Phase 8 Subscriptions & Payments Primary Endpoints
router.get('/plans', getPublicPlans);
router.use('/subscription', subscriptionRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);

// Phase 8 Notifications & Device Tokens
router.use('/notifications', notificationRoutes);
router.use('/settings/notifications', notificationRoutes);
router.use('/device-tokens', notificationRoutes);

// Phase 3 & 9 Public Marketplace APIs
router.use('/apps', appRoutes);
router.use('/categories', categoryRoutes);
router.use('/developers', developerPublicRoutes);
router.use('/doubts', doubtRoutes);

// Phase 9 Reviews, Downloads, Search & Analytics APIs
router.use('/reviews', reviewRoutes);
router.use('/downloads', downloadRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/me/downloads', meDownloadsRouter);

// Phase 7 & 9 Master Admin Control Center, Moderation & Analytics
router.use('/admin', adminAnalyticsRouter);
router.use('/admin', adminRoutes);

// Sprint 12 Beta Launch, Bug Reporting & Feedback
router.use('/feedback', feedbackRoutes);
router.use('/bugs', bugRoutes);
router.use('/admin/beta', betaRoutes);

// Sprint 13 Public Beta, Referrals & Growth
router.use('/waitlist', waitlistRoutes);
router.use('/referrals', referralRoutes);
router.use('/invites', referralRoutes);
router.use('/admin/growth', growthRoutes);

export default router;
