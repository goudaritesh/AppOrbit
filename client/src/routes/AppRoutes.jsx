import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Core Public Pages (eagerly loaded for fast first contentful paint)
import HomePage from '../pages/public/HomePage';
import ExplorePage from '../pages/public/ExplorePage';
import AppDetailsPage from '../pages/public/AppDetailsPage';
import CategoriesPage from '../pages/public/CategoriesPage';
import DeveloperProfilePage from '../pages/public/DeveloperProfilePage';
import NotFoundPage from '../pages/public/NotFoundPage';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';

// Lazy Loaded Pages (Phase 9 Performance & Code-Splitting)
const SearchResultsPage = lazy(() => import('../pages/public/SearchResultsPage'));
const UserDownloadsPage = lazy(() => import('../pages/user/UserDownloadsPage'));

// Auth Pages (Lazy)
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));

// User Profile
const UserProfilePage = lazy(() => import('../pages/user/UserProfilePage'));
const NotificationCenterPage = lazy(() => import('../pages/notifications/NotificationCenterPage'));

// Developer Pages (Lazy)
const DeveloperDashboardPage = lazy(() => import('../pages/developer/DeveloperDashboardPage'));
const DeveloperAppsPage = lazy(() => import('../pages/developer/DeveloperAppsPage'));
const CreateApplicationPage = lazy(() => import('../pages/developer/CreateApplicationPage'));
const EditApplicationPage = lazy(() => import('../pages/developer/EditApplicationPage'));
const DeveloperAppDetailsPage = lazy(() => import('../pages/developer/DeveloperAppDetailsPage'));
const DeveloperAnalyticsPage = lazy(() => import('../pages/developer/DeveloperAnalyticsPage'));
const DeveloperAppAnalyticsPage = lazy(() => import('../pages/developer/DeveloperAppAnalyticsPage'));
const DeveloperProfileSettingsPage = lazy(() => import('../pages/developer/DeveloperProfileSettingsPage'));
const DeveloperSettingsPage = lazy(() => import('../pages/developer/DeveloperSettingsPage'));
const DeveloperVersionsPage = lazy(() => import('../pages/developer/DeveloperVersionsPage'));
const DeveloperVersionSecurityPage = lazy(() => import('../pages/developer/DeveloperVersionSecurityPage'));
const DeveloperPricingPage = lazy(() => import('../pages/developer/DeveloperPricingPage'));
const DeveloperSubscriptionPage = lazy(() => import('../pages/developer/DeveloperSubscriptionPage'));
const DeveloperPaymentsPage = lazy(() => import('../pages/developer/DeveloperPaymentsPage'));
const DeveloperNotificationSettingsPage = lazy(() => import('../pages/developer/DeveloperNotificationSettingsPage'));

// Admin Pages (Lazy)
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminAppsPage = lazy(() => import('../pages/admin/AdminAppsPage'));
const AdminAppReviewPage = lazy(() => import('../pages/admin/AdminAppReviewPage'));
const AdminSecurityPage = lazy(() => import('../pages/admin/AdminSecurityPage'));
const AdminSecurityDetailPage = lazy(() => import('../pages/admin/AdminSecurityDetailPage'));
const AdminDevelopersPage = lazy(() => import('../pages/admin/AdminDevelopersPage'));
const AdminDeveloperDetailPage = lazy(() => import('../pages/admin/AdminDeveloperDetailPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminSubscriptionsPage = lazy(() => import('../pages/admin/AdminSubscriptionsPage'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminSupportPage = lazy(() => import('../pages/admin/AdminSupportPage'));
const AdminSupportDetailPage = lazy(() => import('../pages/admin/AdminSupportDetailPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminNotificationsPage = lazy(() => import('../pages/admin/AdminNotificationsPage'));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminSearchPage = lazy(() => import('../pages/admin/AdminSearchPage'));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage'));

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader message="Loading AppOrbit workspace..." />}>
      <Routes>
        {/* 1. Public Marketplace & Auth Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/apps" element={<ExplorePage />} />
          <Route path="/apps/:slug" element={<AppDetailsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/developers/:id" element={<DeveloperProfilePage />} />
          <Route path="/search" element={<SearchResultsPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected User Account Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-downloads"
            element={
              <ProtectedRoute>
                <UserDownloadsPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 8 Real-time Notification Center */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenterPage />
              </ProtectedRoute>
            }
          />

          {/* Access Denied Page */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* 2. Protected Developer Console Routes */}
        <Route
          path="/developer"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['DEVELOPER', 'ADMIN', 'SUPER_ADMIN']}>
                <DashboardLayout portalType="developer" />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DeveloperDashboardPage />} />
          <Route path="apps" element={<DeveloperAppsPage />} />
          <Route path="apps/create" element={<CreateApplicationPage />} />
          <Route path="apps/:appId" element={<DeveloperAppDetailsPage />} />
          <Route path="apps/:appId/edit" element={<EditApplicationPage />} />
          <Route path="apps/:appId/media" element={<EditApplicationPage />} />
          <Route path="apps/:appId/versions" element={<DeveloperVersionsPage />} />
          <Route path="apps/:appId/versions/:versionId/security" element={<DeveloperVersionSecurityPage />} />
          <Route path="apps/:appId/analytics" element={<DeveloperAppAnalyticsPage />} />
          <Route path="pricing" element={<DeveloperPricingPage />} />
          <Route path="subscription" element={<DeveloperSubscriptionPage />} />
          <Route path="payments" element={<DeveloperPaymentsPage />} />
          <Route path="settings/notifications" element={<DeveloperNotificationSettingsPage />} />
          <Route path="analytics" element={<DeveloperAnalyticsPage />} />
          <Route path="profile" element={<DeveloperProfileSettingsPage />} />
          <Route path="settings" element={<DeveloperSettingsPage />} />
        </Route>

        {/* 3. Protected Admin Control Center Routes (Phase 7 & 9) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  'ADMIN',
                  'SUPER_ADMIN',
                  'MODERATOR',
                  'SECURITY_REVIEWER',
                  'SUPPORT_AGENT',
                  'FINANCE_ADMIN',
                ]}
              >
                <DashboardLayout portalType="admin" />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="apps" element={<AdminAppsPage />} />
          <Route path="apps/review" element={<AdminAppsPage />} />
          <Route path="apps/:appId" element={<AdminAppReviewPage />} />
          <Route path="apps/:appId/review" element={<AdminAppReviewPage />} />
          <Route path="security" element={<AdminSecurityPage />} />
          <Route path="security/:reportId" element={<AdminSecurityDetailPage />} />
          <Route path="developers" element={<AdminDevelopersPage />} />
          <Route path="developers/:developerId" element={<AdminDeveloperDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="support/:ticketId" element={<AdminSupportDetailPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="search" element={<AdminSearchPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
