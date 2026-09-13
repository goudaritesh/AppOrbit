import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Smartphone,
  Cpu,
  Globe,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';

export const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh]">
      <SEOHead
        title="About AppOrbit — Decentralized & Verified Android App Marketplace"
        description="Learn about AppOrbit, our mission to empower independent Android developers, and our multi-layered cryptographic APK security verification pipeline."
      />

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Independent Software Distribution</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-content-primary tracking-tight mb-4">
          Empowering Independent Android Innovation
        </h1>
        <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
          AppOrbit is a next-generation open application ecosystem connecting independent mobile developers directly with users worldwide. We eliminate predatory distribution monopolies through transparent security verification and developer-first economics.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card padding="lg" className="flex flex-col gap-4 border border-white/10 hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-content-primary">
            Verified Security Pipeline
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Every APK undergoes cryptographic integrity checks, automated structure inspection, signature validation, and quarantined staging before publication approval.
          </p>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4 border border-white/10 hover:border-accent-cyan/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-content-primary">
            Independent Developers
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Direct distribution channels empower individual creators, indie studios, and open-source contributors without algorithmic manipulation or arbitrary deplatforming.
          </p>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4 border border-white/10 hover:border-accent-emerald/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-content-primary">
            Global Open Ecosystem
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Fast, secure direct APK downloads with full version history, transparent changelogs, and verified developer identity badges.
          </p>
        </Card>
      </div>

      {/* Platform Values / Philosophy */}
      <div className="rounded-3xl bg-surface border border-white/10 p-8 sm:p-12 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary mb-3">
            Why We Built AppOrbit
          </h2>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            Mobile operating systems should remain open computing platforms. When developers face gatekeeping fees and opaque review processes, innovation suffers. AppOrbit provides a transparent, accountable, and high-trust alternative.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-content-secondary">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
            <span>Zero predatory revenue cuts</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
            <span>Cryptographic SHA-256 package verification</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
            <span>Authentic community review ecosystem</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
            <span>Multi-layer malware and capability analysis</span>
          </div>
        </div>
      </div>

      {/* Creator Section */}
      <div className="mb-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary mb-8 text-center">
          Leadership
        </h2>
        <div className="max-w-4xl mx-auto rounded-3xl bg-surface border border-white/10 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 hover:border-primary/30 transition-colors">
          {/* Subtle background glow */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex-shrink-0 relative z-10">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-surface-elevated shadow-xl ring-2 ring-primary/20">
              <img
                src="/images/creator/ritesh.png"
                alt="Ritesh - Creator of AppOrbit"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://ui-avatars.com/api/?name=Ritesh&background=6366F1&color=fff&size=256';
                }}
              />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-xs font-mono text-accent-cyan mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Founder & Lead Engineer</span>
            </div>
            <h3 className="text-3xl font-extrabold font-heading text-content-primary mb-2">
              Ritesh Kumar Gouda
            </h3>
            <p className="text-content-secondary leading-relaxed mb-6">
              "Driven by a vision to democratize mobile software distribution, AppOrbit was founded to provide developers with a transparent, secure, and equitable platform. We believe the mobile ecosystem should foster innovation rather than gatekeep it through restrictive monopolies. AppOrbit represents a commitment to an open, cryptographically verified future for Android developers and users alike."
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <a
                href="mailto:goudariteshkumar@gmail.com"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-content-dim hover:text-rose-500 transition-colors border border-white/5 flex items-center gap-2"
                title="Email"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline-block">Email</span>
              </a>
              <a
                href="https://github.com/goudaritesh"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-content-dim hover:text-white transition-colors border border-white/5 flex items-center gap-2"
                title="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline-block">GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/ritesh-ku-gouda/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-content-dim hover:text-blue-500 transition-colors border border-white/5 flex items-center gap-2"
                title="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline-block">LinkedIn</span>
              </a>
              <a
                href="https://instagram.com/apporbit.official"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-content-dim hover:text-pink-500 transition-colors border border-white/5 flex items-center gap-2"
                title="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline-block">apporbit.official</span>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
