import AdmZip from 'adm-zip';

/**
 * Static Analysis Service (Phase 6 Production Implementation)
 * Inspects manifest components, debug flags, exported entry points, native binaries,
 * and suspicious string tokens strictly without executing the APK code.
 */
export class StaticAnalysisService {
  /**
   * Run static analysis on APK buffer
   * @param {Buffer} buffer - APK binary buffer
   * @returns {Object} Static analysis findings
   */
  static analyze(buffer) {
    if (!buffer || buffer.length === 0) {
      return {
        debuggable: false,
        exportedComponentsCount: 0,
        exportedComponents: [],
        nativeLibraries: [],
        architectures: [],
        suspiciousIndicators: [],
        obfuscationIndicators: [],
        warnings: [],
      };
    }

    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const warnings = [];
      const suspiciousIndicators = [];
      const obfuscationIndicators = [];

      // 1. Inspect Native Libraries under lib/
      const nativeLibraries = [];
      const archSet = new Set();

      entries.forEach((entry) => {
        const name = entry.entryName;
        if (name.startsWith('lib/') && name.endsWith('.so')) {
          const parts = name.split('/');
          const arch = parts.length >= 3 ? parts[1] : 'unknown';
          archSet.add(arch);
          nativeLibraries.push({
            architecture: arch,
            name: parts[parts.length - 1],
            size: entry.header.size,
          });
        }
      });

      // 2. Inspect for Suspicious Embedded Executables or Scripts
      const suspiciousExtensions = ['.sh', '.exe', '.bat', '.cmd', '.vbs', '.ps1', '.elf'];
      entries.forEach((entry) => {
        const lower = entry.entryName.toLowerCase();
        for (const ext of suspiciousExtensions) {
          if (lower.endsWith(ext) && !lower.startsWith('meta-inf/')) {
            suspiciousIndicators.push(`Embedded non-Android executable script detected: ${entry.entryName}`);
            warnings.push(`APK contains executable script (${entry.entryName}). This requires verification.`);
          }
        }
      });

      // 3. Inspect AndroidManifest.xml for debuggable flag and exported components
      let debuggable = false;
      const exportedComponents = [];

      const manifestEntry = zip.getEntry('AndroidManifest.xml');
      if (manifestEntry) {
        const manifestData = manifestEntry.getData();
        const manifestString = manifestData.toString('latin1');

        // Check debuggable token
        if (
          manifestString.includes('android:debuggable="true"') ||
          manifestString.includes('debuggable\x00') ||
          /debuggable[^\w]{0,10}true/i.test(manifestString)
        ) {
          debuggable = true;
          warnings.push('APK is compiled in debug mode (android:debuggable=true). Production releases should disable debugging.');
        }

        // Check for exported components
        const componentTypes = ['activity', 'service', 'receiver', 'provider'];
        componentTypes.forEach((type) => {
          const regex = new RegExp(`<${type}[^>]+android:exported=["']true["']`, 'gi');
          let match;
          while ((match = regex.exec(manifestString)) !== null) {
            const nameMatch = match[0].match(/android:name=["']([^"']+)["']/i);
            exportedComponents.push({
              type,
              name: nameMatch ? nameMatch[1] : `Exported ${type}`,
              exported: true,
            });
          }
        });

        // Also inspect for known root execution or suspicious command strings
        if (
          manifestString.includes('/system/bin/su') ||
          manifestString.includes('/system/xbin/su') ||
          manifestString.includes('su --command')
        ) {
          suspiciousIndicators.push('Manifest contains root privilege acquisition string references (su)');
        }
      }

      // 4. Obfuscation Indicators (ProGuard / R8 detection)
      // Check entry names in classes.dex or archive for very short identifiers (e.g. a/a/a.class)
      const shortEntries = entries.filter((e) => /^[a-z]\/[a-z]\/[a-z0-9]+\.class$/i.test(e.entryName));
      if (shortEntries.length > 5) {
        obfuscationIndicators.push('Class name minification and symbol stripping detected (ProGuard / R8)');
      }

      return {
        debuggable,
        exportedComponentsCount: exportedComponents.length,
        exportedComponents,
        nativeLibraries,
        architectures: Array.from(archSet),
        suspiciousIndicators,
        obfuscationIndicators,
        warnings,
      };
    } catch (err) {
      return {
        debuggable: false,
        exportedComponentsCount: 0,
        exportedComponents: [],
        nativeLibraries: [],
        architectures: [],
        suspiciousIndicators: [],
        obfuscationIndicators: [],
        warnings: [`Static analysis warning: ${err.message}`],
      };
    }
  }
}

export default StaticAnalysisService;
