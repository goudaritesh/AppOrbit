import React, { useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import SEOHead from '../../components/common/SEOHead';

export const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh]">
      <SEOHead
        title="Privacy Policy — AppOrbit"
        description="Learn how AppOrbit collects, safeguards, and minimizes user data when discovering and downloading Android applications."
      />

      <div className="flex flex-col gap-3 mb-10 pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Data Governance & Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-content-muted font-mono">
          Effective Date: September 2026 • Platform Version: 1.0.0
        </p>
      </div>

      <div className="flex flex-col gap-8 text-xs sm:text-sm text-content-secondary leading-relaxed">
        {/* Core Principles */}
        <Card padding="md" className="border border-accent-emerald/20 bg-accent-emerald/5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-content-primary text-sm mb-1">
                Data Minimization Commitment
              </h3>
              <p className="text-xs text-content-secondary">
                AppOrbit believes in collecting only the data essential to providing secure, abuse-resistant software distribution. We never sell your personal data or track your browsing activity across other websites.
              </p>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            1. Information We Collect
          </h2>
          <p>
            When you interact with the AppOrbit public marketplace, we collect minimal operational information:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-content-muted">
            <li><strong className="text-content-secondary">Download Telemetry:</strong> When downloading an APK, we record an anonymized cryptographic SHA-256 hash of your IP address and client User-Agent string to enforce download rate limits and detect automated abuse.</li>
            <li><strong className="text-content-secondary">Account Data:</strong> If you register as a user or developer, we store your name, email address, password hash (bcrypt), and optional public profile details.</li>
            <li><strong className="text-content-secondary">Search Queries:</strong> Anonymous search terms are collected in aggregate to improve marketplace recommendations and autocomplete indexing.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            2. How We Use Information
          </h2>
          <p>
            We process collected information solely for legitimate operational purposes:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-content-muted">
            <li>Authorizing and streaming secure, short-lived APK download tokens.</li>
            <li>Detecting denial-of-service attempts, fraudulent download inflation, and security threats.</li>
            <li>Providing authenticated developers with aggregated download analytics (without revealing individual user identities).</li>
            <li>Sending critical transactional alerts, such as review moderation status or account security notices.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            3. Data Retention & Privacy Controls
          </h2>
          <p>
            Download tokens expire after 5 to 20 minutes. IP hash records are retained for security audit logs and automatically rotated. Registered users can request account deletion or data exports at any time by contacting our privacy officer at <span className="font-mono text-primary">privacy@apporbit.dev</span>.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            4. Third-Party Disclosures
          </h2>
          <p>
            AppOrbit does not share, rent, or monetize consumer telemetry with data brokers, ad networks, or analytics trackers. Disclosures only occur when strictly required by enforceable legal process or emergency security threat response.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
