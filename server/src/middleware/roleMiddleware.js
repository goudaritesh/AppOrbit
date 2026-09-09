import { authorizeRoles } from './authMiddleware.js';

export const restrictTo = authorizeRoles;
export default {
  restrictTo,
  authorizeRoles,
};
