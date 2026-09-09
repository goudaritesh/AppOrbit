import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from '../components/common/PageLoader';

/**
 * ProtectedRoute Component
 * Guards routes requiring an active authenticated session.
 * Displays PageLoader while session initialization completes.
 * Redirects unauthenticated visitors to /login, preserving intended destination.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authInitialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authInitialized) {
    return <PageLoader message="Verifying session security clearance..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
