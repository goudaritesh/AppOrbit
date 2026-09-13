import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * RoleRoute Guard Component
 * Ensures current authenticated user's role matches permitted roles.
 * Redirects unauthorized accounts to /unauthorized.
 *
 * @param {object} props
 * @param {Array<string>} props.allowedRoles
 * @param {React.ReactNode} [props.children]
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useSelector((state) => state.auth);

  // Normalize check to uppercase
  const userRole = user?.role ? user.role.toUpperCase() : '';
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  // SUPER_ADMIN has clearance for ADMIN and DEVELOPER spaces as well
  const hasRole =
    normalizedAllowed.includes(userRole) ||
    (userRole === 'SUPER_ADMIN' && normalizedAllowed.includes('ADMIN'));

  if (!hasRole) {
    // If a normal user tries to access a developer route, redirect to pricing/trial page
    if (userRole === 'USER' && normalizedAllowed.includes('DEVELOPER')) {
      return <Navigate to="/pricing" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
