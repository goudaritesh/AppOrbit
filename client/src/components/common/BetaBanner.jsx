import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bug, MessageSquare, Gift, Rocket, X } from 'lucide-react';
import BetaFeedbackModal from './BetaFeedbackModal';
import ReferralModal from './ReferralModal';

export const BetaBanner = () => {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalTab, setFeedbackModalTab] = useState('feedback');
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="relative z-40 bg-gradient-to-r from-primary/20 via-accent-cyan/15 to-purple-600/20 border-b border-white/10 backdrop-blur-md px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          {/* Badge & Text */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <Link to="/beta" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-[10px] tracking-wider uppercase shadow-sm transition-transform hover:scale-105">
              <Sparkles className="w-3 h-3" />
              Public Beta v0.8.0-BETA
            </Link>
            <span className="text-slate-300 font-medium">
              Welcome to the AppOrbit Public Beta! Discover verified Android apps or{' '}
              <Link to="/beta#waitlist" className="text-accent-cyan hover:underline font-semibold">
                Join the v1.0 Launch Waitlist →
              </Link>
            </span>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setReferralModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-purple-500/30"
            >
              <Gift className="w-3 h-3 text-purple-400" />
              Invite Friends
            </button>
            <button
              onClick={() => {
                setFeedbackModalTab('feedback');
                setFeedbackModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors border border-white/10"
            >
              <MessageSquare className="w-3 h-3 text-primary" />
              Feedback
            </button>
            <button
              onClick={() => {
                setFeedbackModalTab('bug');
                setFeedbackModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-rose-500/30"
            >
              <Bug className="w-3 h-3 text-rose-400" />
              Report Bug
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <BetaFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        initialTab={feedbackModalTab}
      />

      <ReferralModal
        isOpen={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
      />
    </>
  );
};

export default BetaBanner;
