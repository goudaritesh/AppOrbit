import mongoose from 'mongoose';
import App from '../models/App.js';

/**
 * Reusable Application Ownership Verification Middleware.
 * Enforces strict isolation: Developers can only access and manipulate their own applications.
 *
 * Security Policy:
 * Inaccessible or unauthorized applications return HTTP 404 to prevent attackers
 * from enumerating private application IDs across different developer accounts.
 */
export const verifyAppOwnership = async (req, res, next) => {
  try {
    const appId = req.params.appId || req.params.id;

    if (!appId || !mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const app = await App.findById(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Strict ownership verification: app developer must match authenticated user (admins can manage all)
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
    if (!isAdmin && app.developer.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Attach verified application document to request for handler use
    req.app = app;
    next();
  } catch (error) {
    next(error);
  }
};

export default verifyAppOwnership;
