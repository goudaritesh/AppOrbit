import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin, requirePermission } from '../middleware/adminPermissionMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/adminPermissions.js';
import { getAdminReviews, moderateReview } from '../modules/reviews/review.controller.js';

// Controllers
import {
  getDashboardStats,
  getDashboardAnalytics,
} from '../controllers/admin/adminDashboardController.js';
import {
  getAdminApps,
  getAdminAppById,
  approveApp,
  rejectApp,
  requestChanges,
  blockApp,
  unpublishApp,
} from '../controllers/admin/adminAppController.js';
import {
  getAdminDevelopers,
  getAdminDeveloperById,
  suspendDeveloper,
  restoreDeveloper,
  restrictDeveloper,
  addAdminNote,
} from '../controllers/admin/adminDeveloperController.js';
import {
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
} from '../controllers/admin/adminUserController.js';
import {
  getSecurityReports,
  getSecurityReportById,
  submitReviewDecision,
  triggerRescan,
} from '../controllers/adminSecurityController.js';
import {
  getAdminSecurityReport,
  approveApk,
  rejectApk,
  suspendApp,
} from '../controllers/securityTrustController.js';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getDeveloperSubscriptions,
  manualUpdateSubscription,
} from '../controllers/admin/adminSubscriptionController.js';
import {
  getAdminPayments,
  getAdminPaymentById,
  verifyPayment,
} from '../controllers/admin/adminPaymentController.js';
import {
  getSupportTickets,
  getSupportTicketById,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
} from '../controllers/admin/adminSupportController.js';
import {
  getPlatformReports,
  getPlatformReportById,
  resolveReport,
} from '../controllers/admin/adminReportController.js';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/admin/adminNotificationController.js';
import { getAuditLogs } from '../controllers/admin/adminAuditController.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/admin/adminSettingsController.js';
import { globalAdminSearch } from '../controllers/admin/adminSearchController.js';

const router = Router();

// ============================================================================
// 1. BASE SECURITY: All admin routes strictly require authentication + admin role
// ============================================================================
router.use(protect);
router.use(requireAdmin);

// ============================================================================
// 2. DASHBOARD & GLOBAL SEARCH
// ============================================================================
router.get('/dashboard', getDashboardStats);
router.get('/dashboard/analytics', getDashboardAnalytics);
router.get('/search', globalAdminSearch);

// ============================================================================
// 3. APPLICATION MODERATION
// ============================================================================
router.get('/apps', requirePermission(ADMIN_PERMISSIONS.APP_READ), getAdminApps);
router.get('/apps/:appId', requirePermission(ADMIN_PERMISSIONS.APP_READ), getAdminAppById);
router.get('/apps/:appId/security', requirePermission(ADMIN_PERMISSIONS.SECURITY_READ), getAdminSecurityReport);
router.post('/apps/:appId/approve', requirePermission(ADMIN_PERMISSIONS.APP_APPROVE), approveApp);
router.patch('/apps/:appId/approve', requirePermission(ADMIN_PERMISSIONS.APP_APPROVE), approveApk);
router.post('/apps/:appId/reject', requirePermission(ADMIN_PERMISSIONS.APP_REJECT), rejectApp);
router.patch('/apps/:appId/reject', requirePermission(ADMIN_PERMISSIONS.APP_REJECT), rejectApk);
router.patch('/apps/:appId/suspend', requirePermission(ADMIN_PERMISSIONS.APP_BLOCK), suspendApp);
router.post('/apps/:appId/request-changes', requirePermission(ADMIN_PERMISSIONS.APP_REVIEW), requestChanges);
router.post('/apps/:appId/block', requirePermission(ADMIN_PERMISSIONS.APP_BLOCK), blockApp);
router.post('/apps/:appId/unpublish', requirePermission(ADMIN_PERMISSIONS.APP_APPROVE), unpublishApp);

// ============================================================================
// 4. DEVELOPER MANAGEMENT
// ============================================================================
router.get('/developers', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_READ), getAdminDevelopers);
router.get('/developers/:developerId', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_READ), getAdminDeveloperById);
router.post('/developers/:developerId/suspend', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_SUSPEND), suspendDeveloper);
router.post('/developers/:developerId/restore', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_SUSPEND), restoreDeveloper);
router.post('/developers/:developerId/restrict', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_UPDATE), restrictDeveloper);
router.post('/developers/:developerId/notes', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_UPDATE), addAdminNote);

// ============================================================================
// 5. USER MANAGEMENT
// ============================================================================
router.get('/users', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_READ), getAdminUsers);
router.get('/users/:userId', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_READ), getAdminUserById);
router.post('/users/:userId/status', requirePermission(ADMIN_PERMISSIONS.DEVELOPER_UPDATE), updateUserStatus);

// ============================================================================
// 6. SECURITY REVIEW CENTER
// ============================================================================
router.get('/security/reports', requirePermission(ADMIN_PERMISSIONS.SECURITY_READ), getSecurityReports);
router.get('/security/reports/:reportId', requirePermission(ADMIN_PERMISSIONS.SECURITY_READ), getSecurityReportById);
router.post('/security/reports/:reportId/review', requirePermission(ADMIN_PERMISSIONS.SECURITY_APPROVE), submitReviewDecision);
router.post('/security/apps/:appId/versions/:versionId/rescan', requirePermission(ADMIN_PERMISSIONS.SECURITY_REVIEW), triggerRescan);

// ============================================================================
// 7. SUBSCRIPTIONS & PLANS
// ============================================================================
router.get('/subscriptions/plans', requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE), getSubscriptionPlans);
router.post('/subscriptions/plans', requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE), createSubscriptionPlan);
router.put('/subscriptions/plans/:planId', requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE), updateSubscriptionPlan);
router.get('/subscriptions', requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE), getDeveloperSubscriptions);
router.post('/subscriptions/:developerId/update', requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE), manualUpdateSubscription);

// ============================================================================
// 8. PAYMENT TRANSACTIONS & VERIFICATION
// ============================================================================
router.get('/payments', requirePermission(ADMIN_PERMISSIONS.PAYMENT_READ), getAdminPayments);
router.get('/payments/:paymentId', requirePermission(ADMIN_PERMISSIONS.PAYMENT_READ), getAdminPaymentById);
router.post('/payments/:paymentId/verify', requirePermission(ADMIN_PERMISSIONS.PAYMENT_VERIFY), verifyPayment);

// ============================================================================
// 9. SUPPORT TICKETING SYSTEM
// ============================================================================
router.get('/support', requirePermission(ADMIN_PERMISSIONS.SUPPORT_READ), getSupportTickets);
router.get('/support/:ticketId', requirePermission(ADMIN_PERMISSIONS.SUPPORT_READ), getSupportTicketById);
router.post('/support/:ticketId/message', requirePermission(ADMIN_PERMISSIONS.SUPPORT_RESPOND), addTicketMessage);
router.post('/support/:ticketId/status', requirePermission(ADMIN_PERMISSIONS.SUPPORT_RESPOND), updateTicketStatus);
router.post('/support/:ticketId/assign', requirePermission(ADMIN_PERMISSIONS.SUPPORT_RESPOND), assignTicket);

// ============================================================================
// 10. COMMUNITY & VIOLATION REPORTS
// ============================================================================
router.get('/reports', requirePermission(ADMIN_PERMISSIONS.REPORT_READ), getPlatformReports);
router.get('/reports/:reportId', requirePermission(ADMIN_PERMISSIONS.REPORT_READ), getPlatformReportById);
router.post('/reports/:reportId/resolve', requirePermission(ADMIN_PERMISSIONS.REPORT_RESOLVE), resolveReport);

// ============================================================================
// 11. NOTIFICATIONS INBOX
// ============================================================================
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.post('/notifications/read-all', markAllNotificationsAsRead);

// ============================================================================
// 12. IMMUTABLE FORENSIC AUDIT TRAIL
// ============================================================================
router.get('/audit-logs', requirePermission(ADMIN_PERMISSIONS.AUDIT_READ), getAuditLogs);

// ============================================================================
// 13. PLATFORM CONFIGURATION & MAINTENANCE
// ============================================================================
router.get('/settings', requirePermission(ADMIN_PERMISSIONS.SETTINGS_READ), getPlatformSettings);
router.put('/settings', requirePermission(ADMIN_PERMISSIONS.SETTINGS_UPDATE), updatePlatformSettings);

// ============================================================================
// 14. REVIEW MODERATION & REPORTS (Phase 9)
// ============================================================================
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:reviewId/moderate', moderateReview);

export default router;
