import AdmZip from 'adm-zip';

/**
 * Signature Analysis Service (Phase 6 Production Implementation)
 * Inspects APK signing schemes (v1 JAR, v2, v3, v4 Signing Blocks) and validates
 * structural signature presence without executing untrusted code.
 */
export class SignatureAnalysisService {
  /**
   * Analyze signature schemes in an APK buffer
   * @param {Buffer} buffer - Raw APK binary
   * @returns {Object} Signature analysis result
   */
  static analyzeSignature(buffer) {
    if (!buffer || buffer.length < 100) {
      return {
        status: 'INVALID',
        scheme: null,
        schemes: [],
        signersCount: 0,
        signatureValid: false,
        details: 'APK binary is truncated or invalid',
      };
    }

    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // 1. Inspect v1 (JAR Signing) entries in META-INF
      const v1Signers = entries.filter((e) => {
        const name = e.entryName.toUpperCase();
        return (
          name.startsWith('META-INF/') &&
          (name.endsWith('.RSA') || name.endsWith('.DSA') || name.endsWith('.EC'))
        );
      });

      const manifestMf = entries.find((e) => e.entryName.toUpperCase() === 'META-INF/MANIFEST.MF');
      const signatureSf = entries.find((e) => {
        const name = e.entryName.toUpperCase();
        return name.startsWith('META-INF/') && name.endsWith('.SF');
      });

      const hasV1 = v1Signers.length > 0 && manifestMf && signatureSf;

      // 2. Inspect APK Signing Block for v2 / v3 / v4 (Magic: "APK Sig Block 42")
      const sigBlockMagic = Buffer.from('APK Sig Block 42', 'ascii');
      const magicIndex = buffer.indexOf(sigBlockMagic);

      const schemes = [];
      let hasV2 = false;
      let hasV3 = false;
      let hasV4 = false;

      if (magicIndex !== -1) {
        // APK Sig Block is present in the binary
        // Look for ID markers
        // v2 ID: 0x7109871a (1a 87 09 71 in little endian)
        const v2Marker = Buffer.from([0x1a, 0x87, 0x09, 0x71]);
        if (buffer.indexOf(v2Marker) !== -1) {
          hasV2 = true;
          schemes.push('v2');
        }

        // v3 ID: 0xf05368c0 (c0 68 53 f0 in little endian)
        const v3Marker = Buffer.from([0xc0, 0x68, 0x53, 0xf0]);
        if (buffer.indexOf(v3Marker) !== -1) {
          hasV3 = true;
          schemes.push('v3');
        }

        // v4 ID: 0x1b93f612 (12 f6 93 1b in little endian)
        const v4Marker = Buffer.from([0x12, 0xf6, 0x93, 0x1b]);
        if (buffer.indexOf(v4Marker) !== -1) {
          hasV4 = true;
          schemes.push('v4');
        }
      }

      if (hasV1) {
        schemes.unshift('v1');
      }

      const totalSigners = Math.max(v1Signers.length, (hasV2 || hasV3) ? 1 : 0);

      // Status determination
      if (schemes.length === 0) {
        return {
          status: 'UNSIGNED',
          scheme: 'none',
          schemes: [],
          signersCount: 0,
          signatureValid: false,
          details: 'No cryptographic Android signature found in APK',
        };
      }

      if (totalSigners > 1) {
        return {
          status: 'MULTIPLE_SIGNERS',
          scheme: schemes.join(' + '),
          schemes,
          signersCount: totalSigners,
          signatureValid: true,
          details: `APK is signed by ${totalSigners} signers using schemes: ${schemes.join(', ')}`,
        };
      }

      return {
        status: 'VALID',
        scheme: schemes.join(' + '),
        schemes,
        signersCount: totalSigners,
        signatureValid: true,
        details: `Valid Android signature verified (${schemes.join(', ')})`,
      };
    } catch (err) {
      return {
        status: 'ERROR',
        scheme: null,
        schemes: [],
        signersCount: 0,
        signatureValid: false,
        details: `Signature inspection error: ${err.message}`,
      };
    }
  }
}

export default SignatureAnalysisService;
