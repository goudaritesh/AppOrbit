import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-low border-t border-white/10 pt-16 pb-12 transition-colors">
      <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface border border-white/10 flex items-center justify-center p-1.5 shadow-sm">
                <img src="/logo.svg" alt="AppOrbit" className="w-full h-full object-contain" />
              </div>
              <span className="font-heading font-extrabold text-lg text-content-primary tracking-tight">
                App<span className="text-primary">Orbit</span>
              </span>
            </Link>
            <p className="text-xs text-content-muted leading-relaxed max-w-sm">
              AppOrbit is a high-trust Android application publishing, discovery, and distribution marketplace. We provide enterprise APK distribution pipelines for developers and secure, verified mobile software for users worldwide.
            </p>
            <div className="flex items-center gap-2 text-accent-emerald text-xs font-mono pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically verified release signatures</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary font-mono">
              Marketplace
            </h4>
            <ul className="flex flex-col space-y-2 text-xs text-content-muted">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Applications
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=top-rated" className="hover:text-white transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=newest" className="hover:text-white transition-colors">
                  Latest Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary font-mono">
              Developers
            </h4>
            <ul className="flex flex-col space-y-2 text-xs text-content-muted">
              <li>
                <Link to="/developer" className="hover:text-white transition-colors">
                  Developer Console
                </Link>
              </li>
              <li>
                <Link to="/developer/apps" className="hover:text-white transition-colors">
                  App Management
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Join as Developer
                </Link>
              </li>
              <li>
                <span className="text-content-dim cursor-not-allowed">SDK & API Docs (Phase 3)</span>
              </li>
            </ul>
          </div>

          {/* Support & Legal Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary font-mono">
              Platform & Legal
            </h4>
            <ul className="flex flex-col space-y-2 text-xs text-content-muted">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Security Standards</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Developer Agreement</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-dim">
          <p>© {currentYear} AppOrbit Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Version 1.0.0 (Phase 1 Foundation)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald" />
            <span>Systems Normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
