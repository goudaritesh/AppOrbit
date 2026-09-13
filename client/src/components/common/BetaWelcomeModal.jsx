import React, { useState } from 'react';
import {
  Rocket,
  Download,
  Code2,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  {
    icon: Rocket,
    color: 'text-primary bg-primary/10 border-primary/20',
    title: 'Welcome to AppOrbit Beta! 🚀',
    badge: 'v0.8.0 Release',
    description:
      'AppOrbit is the decentralized, indie-first Android application distribution platform. We give independent creators a home to publish their apps and users a transparent marketplace to discover innovation.',
  },
  {
    icon: Download,
    color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
    title: 'Discover & Download High-Quality APKs',
    badge: 'Direct & Fast',
    description:
      'Browse curated categories from Productivity to Security tools. Enjoy high-speed, direct APK downloads without forced accounts, intrusive trackers, or ad popups.',
  },
  {
    icon: Code2,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'Developer Publishing & Deep Analytics',
    badge: 'For Creators',
    description:
      'Developers can upload APKs, manage releases, track real-time download conversion funnels, inspect user reviews, and upgrade to Gold or Diamond studio subscription plans.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: '7-Point Security & Antivirus Gate',
    badge: 'Safety First',
    description:
      'Every uploaded APK undergoes automated quarantine, magic byte verification, heuristic malware analysis, and permission risk scoring before reaching users.',
  },
  {
    icon: MessageSquare,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    title: 'Shape the Future of AppOrbit',
    badge: 'Beta Community',
    description:
      'Found a bug or have a brilliant idea? Use the Beta Banner at the top of the screen at any time to share your feedback or log a bug directly with our core engineering team.',
  },
];

export const BetaWelcomeModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-surface border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent-cyan to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-content-muted hover:text-white rounded-xl hover:bg-white/5 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Card Content */}
        <div className="p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl border ${step.color} shadow-lg animate-scaleUp`}>
              <IconComponent className="w-10 h-10" />
            </div>
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              {step.badge}
            </span>
            <h3 className="text-xl font-heading font-black text-white">{step.title}</h3>
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed max-w-sm mx-auto">
              {step.description}
            </p>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 pt-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {isLast ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaWelcomeModal;
