import { PlatformSettings } from '../../models/PlatformSettings.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Platform Settings Controller (Phase 7 Production Implementation)
 * Governs platform operational thresholds, policy toggles, and maintenance mode.
 */

/**
 * GET /api/admin/settings
 * Retrieve current platform configuration (excluding raw server secrets)
 */
export const getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne({ key: 'GLOBAL_SETTINGS' });

    if (!settings) {
      settings = await PlatformSettings.create({ key: 'GLOBAL_SETTINGS' });
    }

    return res.status(200).json({
      success: true,
      data: { settings },
    });
  } catch (err) {
    next(err);
  }
};

import { clearMaintenanceCache } from '../../middleware/maintenanceMiddleware.js';

/**
 * PUT /api/admin/settings
 * Update platform operational configuration
 */
export const updatePlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne({ key: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = new PlatformSettings({ key: 'GLOBAL_SETTINGS' });
    }

    const previousState = settings.toObject();
    const { general, applications, security, payments, maintenance, reason } = req.body;

    if (general) settings.general = { ...settings.general, ...general };
    if (applications) settings.applications = { ...settings.applications, ...applications };
    if (security) settings.security = { ...settings.security, ...security };
    if (payments) settings.payments = { ...settings.payments, ...payments };
    if (maintenance) {
      const isEnabled = maintenance.enabled !== undefined ? maintenance.enabled : maintenance.isEnabled;
      settings.maintenance = {
        ...settings.maintenance,
        ...maintenance,
        enabled: Boolean(isEnabled),
        startedAt: isEnabled ? new Date() : null,
      };
      clearMaintenanceCache();
    }

    await settings.save();

    await AuditLogService.log({
      req,
      action: 'PLATFORM_SETTINGS_UPDATED',
      resourceType: 'SETTING',
      resourceId: settings._id,
      reason: reason || 'Administrative settings update',
      previousState,
      newState: settings.toObject(),
      severity: maintenance?.enabled ? 'CRITICAL' : 'INFO',
    });

    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully.',
      data: { settings },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getPlatformSettings,
  updatePlatformSettings,
};
