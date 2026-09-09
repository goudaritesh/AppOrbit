import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  FileCheck,
  Hash,
  AlertTriangle,
  Server,
  Terminal,
  Cpu,
  Info,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import SEOHead from '../../components/common/SEOHead';

export const SecurityPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pipelineSteps = [
    {
      title: '1. Binary Quarantine & Staging',
      desc: 'When a developer uploads an APK, it is isolated in a restricted staging environment completely inaccessible to public download requests.',
    },
    {
      title: '2. Static Structure & Manifest Analysis',
      desc: 'Automated parsers unpack the AndroidManifest.xml, verify package namespace ownership, inspect target SDK levels, and evaluate declared permissions.',
    },
    {
      title: '3. Cryptographic Signature & SHA-256 Digest',
      desc: 'Every file is cryptographically hashed with SHA-256. Signatures and certificate fingerprints (v1/v2/v3 schemes) are verified to detect unauthorized tampering.',
    },
    {
      title: '4. Malware & Known Threat Scanning',
      desc: 'Static rule analysis and multi-engine heuristics scan for high-risk permissions, obfuscated packers, suspicious domains, and known trojan signatures.',
    },
    {
      title: '5. Editorial & Policy Review Gate',
      desc: 'Before public release, platform reviewers evaluate metadata completeness, icon quality, and security report scores through the 7-Point Mandatory Approval Gate.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh]">
      <SEOHead
        title="APK Security & Trust Pipeline — AppOrbit"
        description="Learn how AppOrbit validates, scans, and cryptographically verifies Android APK packages before they are made publicly available for download."
      />

      {/* Header */}
      <div className="flex flex-col gap-3 mb-10 pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-accent-emerald uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight">
          APK Security & Verification Standards
        </h1>
        <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
          At AppOrbit, public trust is our foundational principle. Learn how our multi-layered validation pipeline protects users and verifies software provenance.
        </p>
      </div>

      {/* Mandatory Disclaimer Box */}
      <Card padding="md" className="border border-accent-emerald/30 bg-accent-emerald/5 mb-10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-content-primary text-sm mb-1">
              AppOrbit Security Verification Principle
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              This application has passed AppOrbit's configured validation and security checks. No automated or manual review can guarantee that software is completely risk-free. Always inspect permissions and download responsibly.
            </p>
          </div>
        </div>
      </Card>

      {/* Multi-Layer Pipeline Steps */}
      <div className="flex flex-col gap-6 mb-12">
        <h2 className="text-xl font-bold font-heading text-content-primary">
          The 5-Stage Verification Pipeline
        </h2>

        <div className="flex flex-col gap-4">
          {pipelineSteps.map((step, idx) => (
            <Card key={idx} padding="md" className="border border-white/10 flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold flex-shrink-0">
                0{idx + 1}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold font-heading text-content-primary">
                  {step.title}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cryptographic Proof & Capability Download Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <Card padding="md" className="border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-accent-cyan uppercase">
            <Hash className="w-4 h-4" />
            <span>Integrity Guarantees</span>
          </div>
          <h3 className="text-sm font-bold font-heading text-content-primary">
            Public SHA-256 Checksums
          </h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            Every public app release displays its exact SHA-256 hash. Users can verify package binary integrity independently using command-line checksum tools before executing on device.
          </p>
        </Card>

        <Card padding="md" className="border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-accent-purple uppercase">
            <Lock className="w-4 h-4" />
            <span>Capability Tokens</span>
          </div>
          <h3 className="text-sm font-bold font-heading text-content-primary">
            Protected Download Stream
          </h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            Storage paths are never exposed publicly. Downloads require short-lived, signed capability tokens issued exclusively for published, approved application versions.
          </p>
        </Card>
      </div>

      {/* Incident Reporting */}
      <div className="p-6 rounded-2xl bg-surface-elevated border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold font-heading text-content-primary">
            Discovered a Potential Security Vulnerability?
          </h3>
          <p className="text-xs text-content-muted mt-1">
            Our security response team investigates all submitted reports within 24 hours.
          </p>
        </div>
        <a
          href="mailto:security@apporbit.dev"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium bg-accent-rose/10 hover:bg-accent-rose text-accent-rose hover:text-white border border-accent-rose/20 transition-all flex-shrink-0"
        >
          <span>Report Threat</span>
        </a>
      </div>
    </div>
  );
};

export default SecurityPage;
