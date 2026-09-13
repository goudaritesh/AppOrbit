import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  Download,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Rocket,
  Globe,
  Mail,
  Copy,
  Check,
  FileText,
  Boxes,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PressKitPage = () => {
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const brandColors = [
    { name: 'Space Background', hex: '#0B0E14', desc: 'Primary application canvas' },
    { name: 'Surface Low', hex: '#11151F', desc: 'Card and container background' },
    { name: 'Electric Indigo', hex: '#6366F1', desc: 'Primary branding and buttons' },
    { name: 'Neon Cyan', hex: '#06B6D4', desc: 'Accents and download indicators' },
    { name: 'Security Emerald', hex: '#10B981', desc: 'Verification and security passes' },
  ];

  return (
    <div className="min-h-screen bg-background text-content-primary py-12 px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
      {/* 📰 Header & Introduction */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-low border border-white/10 text-xs font-mono text-primary">
          <FileText className="w-3.5 h-3.5" /> Media Kit & Press Assets
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-content-primary">
          AppOrbit Press & Brand Kit
        </h1>
        <p className="text-sm sm:text-base text-content-muted leading-relaxed">
          Official logos, brand guidelines, founder mission story, and platform statistics for journalists, partners, and community organizers.
        </p>
      </div>

      {/* 🚀 Our Story & Mission */}
      <Card className="p-8 lg:p-10 bg-surface border-white/10 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
            The Product Story
          </span>
          <h2 className="text-2xl font-heading font-extrabold text-content-primary">
            Giving Applications a Life Beyond the Laptop
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-surface-low border border-white/5 space-y-2">
            <span className="text-rose-400 font-mono font-bold uppercase text-[11px]">The Problem</span>
            <p className="text-content-muted leading-relaxed">
              Every year, hundreds of thousands of talented developers and students build brilliant Android applications. Yet, prohibitive developer registration fees, opaque algorithms, and massive corporate ad budgets leave 99% of them undiscovered.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-low border border-white/5 space-y-2">
            <span className="text-accent-cyan font-mono font-bold uppercase text-[11px]">The Solution</span>
            <p className="text-content-muted leading-relaxed">
              AppOrbit creates an open, democratic distribution ecosystem. Independent creators can publish their APKs with zero barrier to entry, while users discover verified, malware-scanned apps with direct download access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-low border border-white/5 space-y-2">
            <span className="text-emerald-400 font-mono font-bold uppercase text-[11px]">The Mission</span>
            <p className="text-content-muted leading-relaxed">
              "We're not just building an app marketplace; we're building a place where developers can give their projects a real life in the hands of real people."
            </p>
          </div>
        </div>
      </Card>

      {/* 🎨 Brand Identity & Logo Assets */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-bold text-content-primary">
            Brand Logos & Visual Assets
          </h3>
          <p className="text-xs text-content-muted">High-resolution brand assets for print and digital publishing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-8 bg-surface-low border-white/10 flex flex-col items-center justify-between gap-6 text-center">
            <div className="w-24 h-24 rounded-2xl bg-surface border border-white/10 flex items-center justify-center p-4 shadow-xl">
              <img src="/logo.png" alt="AppOrbit Logo" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-content-primary">AppOrbit Primary Icon</h4>
              <p className="text-xs text-content-muted font-mono">PNG format</p>
            </div>
            <a href="/logo.png" download="apporbit-logo.png" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Download className="w-4 h-4 mr-1.5" /> Download PNG
              </Button>
            </a>
          </Card>

          <Card className="p-8 bg-surface-low border-white/10 flex flex-col items-center justify-between gap-6 text-center">
            <div className="h-24 px-6 rounded-2xl bg-surface border border-white/10 flex items-center justify-center gap-3 shadow-xl">
              <img src="/logo.png" alt="AppOrbit" className="w-10 h-10 object-cover" />
              <span className="text-2xl font-heading font-extrabold text-content-primary">AppOrbit</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-content-primary">AppOrbit Lockup & Wordmark</h4>
              <p className="text-xs text-content-muted font-mono">Full visual identity lockup</p>
            </div>
            <a href="/logo.png" download="apporbit-lockup.png" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Download className="w-4 h-4 mr-1.5" /> Download Brandmark
              </Button>
            </a>
          </Card>
        </div>
      </section>

      {/* 🌈 Color Palette */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-bold text-content-primary">Official Color Palette</h3>
          <p className="text-xs text-content-muted">Color codes specified across digital and marketing media</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {brandColors.map((color) => (
            <div
              key={color.name}
              onClick={() => handleCopy(color.hex, color.name)}
              className="p-4 rounded-xl bg-surface border border-white/10 hover:border-primary/40 cursor-pointer transition-all space-y-3"
            >
              <div
                className="w-full h-12 rounded-lg border border-white/10 shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <span className="text-xs font-bold text-content-primary block truncate">{color.name}</span>
                <span className="text-[11px] font-mono text-accent-cyan flex items-center gap-1 mt-0.5">
                  {color.hex} <Copy className="w-3 h-3 opacity-60" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📊 Key Platform Metrics */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-bold text-content-primary">Platform Milestones (Public Beta)</h3>
          <p className="text-xs text-content-muted">Verified figures from our live telemetry engine</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-5 bg-surface border-white/10 text-center">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-primary block">100%</span>
            <span className="text-xs text-content-muted uppercase font-mono mt-1 block">APK Antivirus Scanned</span>
          </Card>

          <Card className="p-5 bg-surface border-white/10 text-center">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-accent-cyan block">200 MB</span>
            <span className="text-xs text-content-muted uppercase font-mono mt-1 block">Max APK Payload</span>
          </Card>

          <Card className="p-5 bg-surface border-white/10 text-center">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400 block">&lt; 24h</span>
            <span className="text-xs text-content-muted uppercase font-mono mt-1 block">Review Turnaround</span>
          </Card>

          <Card className="p-5 bg-surface border-white/10 text-center">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-purple-400 block">$0</span>
            <span className="text-xs text-content-muted uppercase font-mono mt-1 block">Account Fee</span>
          </Card>
        </div>
      </section>

      {/* 📬 Press & Media Contact */}
      <Card className="p-8 bg-gradient-to-r from-surface-low via-surface to-surface-low border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Media & Partnership Inquiries
          </h3>
          <p className="text-xs text-content-muted max-w-xl">
            Interested in doing a feature on AppOrbit, interviewing our team, or partnering with your university hackathon or coding club?
          </p>
        </div>

        <a href="mailto:press@apporbit.io">
          <Button variant="primary" size="md" className="shrink-0 text-xs">
            Contact press@apporbit.io
          </Button>
        </a>
      </Card>
    </div>
  );
};

export default PressKitPage;
