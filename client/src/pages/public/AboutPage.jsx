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

      {/* Call to action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-surface-elevated border border-white/10">
        <div>
          <h3 className="text-lg font-bold font-heading text-content-primary">
            Ready to share your Android application?
          </h3>
          <p className="text-xs text-content-muted mt-1">
            Join thousands of independent developers distributing their software on AppOrbit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explore">
            <Button variant="outline" size="md">
              Explore Apps
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Become a Developer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
