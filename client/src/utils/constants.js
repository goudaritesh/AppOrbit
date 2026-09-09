/**
 * Application Constants
 */

export const APP_NAME = 'AppOrbit';
export const APP_TAGLINE = 'Trusted Android Application Publishing & Distribution Platform';

export const ROLES = {
  USER: 'user',
  DEVELOPER: 'developer',
  ADMIN: 'admin',
};

export const APP_CATEGORIES = [
  'All',
  'Education',
  'Productivity',
  'Health',
  'Finance',
  'Utilities',
  'AI',
];

export const APP_STATUS = {
  PUBLISHED: 'published',
  PENDING: 'pending',
  DRAFT: 'draft',
  REJECTED: 'rejected',
};

export const API_ROUTES = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  APPS: {
    LIST: '/apps',
    DETAILS: (slug) => `/apps/${slug}`,
  },
  DEVELOPER: {
    APPS: '/developer/apps',
    METRICS: '/developer/metrics',
  },
  ADMIN: {
    USERS: '/admin/users',
    APPS: '/admin/apps',
    METRICS: '/admin/metrics',
  },
};
