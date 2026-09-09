import React, { useEffect } from 'react';
import { FileText, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import SEOHead from '../../components/common/SEOHead';

export const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh]">
      <SEOHead
        title="Terms of Service — AppOrbit"
        description="Review the terms and conditions governing the use of the AppOrbit platform for users and developers."
      />

      <div className="flex flex-col gap-3 mb-10 pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-content-muted font-mono">
          Last Updated: September 2026 • Version: 1.0.0
        </p>
      </div>

      <div className="flex flex-col gap-8 text-xs sm:text-sm text-content-secondary leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using AppOrbit (the "Platform"), browsing marketplace applications, or downloading any APK files, you agree to be bound by these Terms of Service. If you disagree with any portion, you must discontinue platform use immediately.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            2. Platform Purpose & Role
          </h2>
          <p>
            AppOrbit functions as an independent distribution catalog and security verification intermediary. We enable developers to publish Android packages and users to discover them. Applications are authored, maintained, and operated independently by their respective developers.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            3. Developer Obligations
          </h2>
          <p>
            Developers publishing applications on AppOrbit must agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-content-muted">
            <li>Provide genuine, lawful software free of undisclosed malware, spyware, trojans, or unauthorized cryptominers.</li>
            <li>Accurately represent software capabilities, privacy practices, and necessary Android system permissions.</li>
            <li>Respect intellectual property rights and only upload software they own or are licensed to distribute.</li>
            <li>Promptly update applications to address discovered security flaws or compatibility defects.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            4. APK Installation & Security Disclaimer
          </h2>
          <Card padding="md" className="border border-accent-amber/20 bg-accent-amber/5 my-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-amber flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-content-primary text-xs mb-1">
                  Important Software Disclaimer
                </h4>
                <p className="text-xs text-content-muted leading-relaxed">
                  Applications hosted on AppOrbit undergo multi-layered validation and automated security checks. However, no automated or manual inspection can guarantee that software is 100% risk-free. Users download and install Android packages at their own discretion and assume appropriate responsibility.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base sm:text-lg font-bold font-heading text-content-primary">
            5. Termination & Suspension
          </h2>
          <p>
            AppOrbit reserves the absolute right to suspend, delist, or block any application or developer account found in violation of platform safety standards, copyright laws, or community policies without prior notice.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
