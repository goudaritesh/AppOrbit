/**
 * Android Permission Risk Classifier Dictionary
 */
const PERMISSION_RISK_MAP = {
  // CRITICAL (Sensitive system privileges)
  'android.permission.REQUEST_INSTALL_PACKAGES': 'CRITICAL',
  'android.permission.SYSTEM_ALERT_WINDOW': 'CRITICAL',
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 'CRITICAL',
  'android.permission.BIND_DEVICE_ADMIN': 'CRITICAL',
  'android.permission.PROCESS_OUTGOING_CALLS': 'CRITICAL',
  'android.permission.WRITE_SECURE_SETTINGS': 'CRITICAL',
  'android.permission.READ_PRIVILEGED_PHONE_STATE': 'CRITICAL',

  // HIGH (Privacy-invasive / sensitive personal data)
  'android.permission.READ_SMS': 'HIGH',
  'android.permission.SEND_SMS': 'HIGH',
  'android.permission.RECEIVE_SMS': 'HIGH',
  'android.permission.READ_CALL_LOG': 'HIGH',
  'android.permission.WRITE_CALL_LOG': 'HIGH',
  'android.permission.READ_CONTACTS': 'HIGH',
  'android.permission.WRITE_CONTACTS': 'HIGH',
  'android.permission.GET_ACCOUNTS': 'HIGH',
  'android.permission.USE_BIOMETRIC': 'HIGH',

  // MEDIUM (Hardware sensors & location)
  'android.permission.CAMERA': 'MEDIUM',
  'android.permission.RECORD_AUDIO': 'MEDIUM',
  'android.permission.ACCESS_FINE_LOCATION': 'MEDIUM',
  'android.permission.ACCESS_COARSE_LOCATION': 'MEDIUM',
  'android.permission.ACCESS_BACKGROUND_LOCATION': 'HIGH',
  'android.permission.READ_EXTERNAL_STORAGE': 'MEDIUM',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'MEDIUM',
  'android.permission.READ_MEDIA_IMAGES': 'MEDIUM',
  'android.permission.READ_MEDIA_VIDEO': 'MEDIUM',
  'android.permission.READ_MEDIA_AUDIO': 'MEDIUM',
  'android.permission.BLUETOOTH': 'MEDIUM',
  'android.permission.BLUETOOTH_CONNECT': 'MEDIUM',
  'android.permission.BLUETOOTH_SCAN': 'MEDIUM',

  // LOW (Standard utilities)
  'android.permission.INTERNET': 'LOW',
  'android.permission.ACCESS_NETWORK_STATE': 'LOW',
  'android.permission.ACCESS_WIFI_STATE': 'LOW',
  'android.permission.VIBRATE': 'LOW',
  'android.permission.WAKE_LOCK': 'LOW',
  'android.permission.RECEIVE_BOOT_COMPLETED': 'LOW',
  'android.permission.POST_NOTIFICATIONS': 'LOW',
};

/**
 * Permission Analysis Service (Phase 6 Production Implementation)
 * Evaluates declared Android permissions against sensitivity tiers, detects dangerous
 * permission combinations, and outputs weighted risk indicators.
 */
export class PermissionAnalysisService {
  /**
   * Analyze requested permissions array
   * @param {string[]} permissions - List of declared permissions
   * @returns {Object} Permission risk assessment
   */
  static analyzePermissions(permissions = []) {
    const rawList = Array.isArray(permissions) ? permissions : [];
    const normalized = rawList.map((p) => (p.startsWith('android.permission.') ? p : `android.permission.${p}`));

    const riskPermissions = [];
    const warnings = [];
    const dangerousCombinations = [];

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    normalized.forEach((perm) => {
      const shortName = perm.replace('android.permission.', '');
      const risk = PERMISSION_RISK_MAP[perm] || 'LOW';

      if (risk === 'CRITICAL') criticalCount++;
      else if (risk === 'HIGH') highCount++;
      else if (risk === 'MEDIUM') mediumCount++;
      else lowCount++;

      if (risk !== 'LOW') {
        riskPermissions.push({
          permission: shortName,
          fullPermission: perm,
          risk,
        });
      }
    });

    // Detect Dangerous Combinations
    const has = (shortName) =>
      normalized.some((p) => p === `android.permission.${shortName}` || p === shortName);

    // 1. SMS + Internet
    if ((has('READ_SMS') || has('SEND_SMS') || has('RECEIVE_SMS')) && has('INTERNET')) {
      dangerousCombinations.push({
        id: 'SMS_OVER_NETWORK',
        name: 'SMS Access + Network Connectivity',
        severity: 'HIGH',
        description: 'Application requests SMS interception/sending capabilities alongside unrestricted Internet access.',
      });
      warnings.push('This APK requests access to SMS permissions alongside Internet access. Ensure these permissions are essential for core functionality.');
    }

    // 2. Accessibility + Overlay
    if (has('BIND_ACCESSIBILITY_SERVICE') && has('SYSTEM_ALERT_WINDOW')) {
      dangerousCombinations.push({
        id: 'ACCESSIBILITY_OVERLAY',
        name: 'Accessibility Service + System Overlay Window',
        severity: 'CRITICAL',
        description: 'Application requests accessibility event monitoring with overlay display permissions.',
      });
      warnings.push('Combination of Accessibility Service and System Overlay window detected. Requires manual platform review.');
    }

    // 3. Package Installer + Internet
    if (has('REQUEST_INSTALL_PACKAGES') && has('INTERNET')) {
      dangerousCombinations.push({
        id: 'PACKAGE_INSTALLER',
        name: 'Package Installer + Network Access',
        severity: 'HIGH',
        description: 'Application requests permission to install secondary APK packages from remote network sources.',
      });
      warnings.push('Permission to install secondary packages requested. Verify that application behaves as a legitimate installer or updater.');
    }

    // 4. Audio/Camera + Background Location
    if ((has('RECORD_AUDIO') || has('CAMERA')) && (has('ACCESS_BACKGROUND_LOCATION') || has('ACCESS_FINE_LOCATION'))) {
      dangerousCombinations.push({
        id: 'SURVEILLANCE_PROFILE',
        name: 'Sensor Recording + Precise Location',
        severity: 'MEDIUM',
        description: 'Application requests simultaneous camera/microphone access with physical geolocation.',
      });
    }

    // Compute composite permission score (0-100)
    let permScore =
      criticalCount * 25 +
      highCount * 12 +
      mediumCount * 4 +
      dangerousCombinations.length * 15;

    permScore = Math.min(100, permScore);

    let riskLevel = 'LOW';
    if (permScore >= 75 || criticalCount > 0) riskLevel = 'CRITICAL';
    else if (permScore >= 50 || highCount > 1) riskLevel = 'HIGH';
    else if (permScore >= 20 || mediumCount > 2) riskLevel = 'MEDIUM';

    return {
      permissions: normalized.map((p) => p.replace('android.permission.', '')),
      riskPermissions,
      riskScore: permScore,
      riskLevel,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      dangerousCombinations,
      warnings,
    };
  }
}

export default PermissionAnalysisService;
