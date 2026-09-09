import { PlatformSettings } from '../models/PlatformSettings.js';

let cachedMaintenance = null;
let cacheExpiry = 0;

/**
 * Maintenance Mode Gatekeeper
 * Intercepts requests when platform maintenance is toggled on,
 * permitting administrative operations while gracefully rejecting public consumer and developer requests with 503.
 */
export const maintenanceMiddleware = async (req, res, next) => {
  try {
    // 1. Always exempt health checks, authentication, and admin endpoints
    const path = req.path || req.originalUrl || '';
    if (
      path.startsWith('/api/health') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/admin')
    ) {
      return next();
    }

    // 2. Check cached maintenance state (refresh every 5 seconds for fast response)
    const now = Date.now();
    if (!cachedMaintenance || now > cacheExpiry) {
      const settings = await PlatformSettings.findOne({ key: 'GLOBAL_SETTINGS' }).lean();
      cachedMaintenance = settings?.maintenance || { enabled: false };
      cacheExpiry = now + 5000;
    }

    if (cachedMaintenance.enabled) {
      // Allow authenticated admin users through
      if (
        req.user &&
        (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')
      ) {
        return next();
      }

      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE_MODE',
        title: cachedMaintenance.title || 'Platform Under Maintenance',
        message:
          cachedMaintenance.message ||
          'AppOrbit is currently undergoing scheduled maintenance. Please check back shortly.',
        estimatedEndTime: cachedMaintenance.estimatedEndTime,
      });
    }

    next();
  } catch (err) {
    // Fail open if maintenance lookup fails to avoid total platform freeze
    console.error('[MaintenanceMiddleware] Error reading maintenance state:', err);
    next();
  }
};

export const clearMaintenanceCache = () => {
  cachedMaintenance = null;
  cacheExpiry = 0;
};

export default maintenanceMiddleware;
