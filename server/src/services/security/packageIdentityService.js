import { App } from '../../models/App.js';
import { AppVersion } from '../../models/AppVersion.js';

/**
 * Package Identity Service (Phase 6 Production Implementation)
 * Enforces package name consistency and monotonic version progression across releases.
 */
export class PackageIdentityService {
  /**
   * Verify package identity and version ordering
   * @param {Object} params
   * @param {Object} params.version - The version document under analysis
   * @param {string} params.appId - Parent application ID
   * @returns {Promise<Object>} Identity verification result
   */
  static async verifyIdentity({ version, appId }) {
    const app = await App.findById(appId);
    if (!app) {
      return {
        packageNameValid: false,
        packageMatchesApp: false,
        versionCodeValid: false,
        monotonicCode: false,
        error: 'Parent application not found',
      };
    }

    const currentPackage = version.packageName;
    let packageMatchesApp = true;
    let reason = null;

    if (app.packageName && currentPackage && app.packageName !== currentPackage) {
      packageMatchesApp = false;
      reason = `APK package name (${currentPackage}) does not match registered application package (${app.packageName})`;
    }

    // Check version code against latest completed version
    const previousVersions = await AppVersion.find({
      app: appId,
      _id: { $ne: version._id },
      processingStatus: 'COMPLETED',
      uploadStatus: { $ne: 'DELETED' },
    }).sort({ versionCode: -1 });

    let monotonicCode = true;
    let highestPreviousCode = 0;

    if (previousVersions.length > 0) {
      highestPreviousCode = previousVersions[0].versionCode;
      if (version.versionCode < highestPreviousCode) {
        monotonicCode = false;
      }
    }

    return {
      packageNameValid: Boolean(currentPackage),
      packageMatchesApp,
      versionCodeValid: version.versionCode > 0,
      monotonicCode,
      highestPreviousCode,
      reason,
    };
  }
}

export default PackageIdentityService;
