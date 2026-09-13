import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { adminApi } from '../../api/adminApi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Boxes,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Linkedin,
  Twitter,
  Send,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReferralModal = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchReferralData();
    }
  }, [isOpen, isAuthenticated]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMyReferrals();
      const payload = res?.data?.data || res?.data || res;
      if (payload) {
        setReferralData(payload);
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://apporbit.io';
  const code = referralData?.referralCode || 'AO-BETA';
  const inviteUrl = `${origin}/signup?ref=${code}`;
  const shareText = `Join me on AppOrbit! Discover innovative Android apps or showcase your projects to the world: ${inviteUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-lg bg-surface border-white/10 shadow-2xl p-6 lg:p-8 space-y-6 overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-extrabold text-content-primary">
                Invite Friends & Creators
              </h3>
              <p className="text-xs text-content-muted">
                Earn bonus publishing slots and community perks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="py-6 text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-primary opacity-70" />
            <p className="text-sm font-semibold text-content-primary">
              Sign in to unlock your personal referral link
            </p>
            <p className="text-xs text-content-muted max-w-sm mx-auto">
              Share your invite link with developer friends and earn extra publishing quota when they release their first application!
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  window.location.href = '/login';
                }}
              >
                Sign In to Get Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-low border border-white/5 text-center">
                <span className="text-[10px] uppercase font-mono text-content-muted block">Invited</span>
                <span className="text-xl font-bold font-mono text-content-primary">
                  {referralData?.referralStats?.totalReferred || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-low border border-white/5 text-center">
                <span className="text-[10px] uppercase font-mono text-content-muted block">Activated Devs</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {referralData?.referralStats?.activatedDevelopers || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-low border border-white/5 text-center">
                <span className="text-[10px] uppercase font-mono text-content-muted block">Bonus Slots</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  +{referralData?.referralStats?.rewardedSlots || 0}
                </span>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-content-muted">Your Personal Referral Link</label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-low border border-white/10">
                <span className="text-xs font-mono text-accent-cyan truncate flex-1 select-all px-2">
                  {inviteUrl}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* One-Click Social Sharing */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-content-muted">Share to Social Channels</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex flex-col items-center gap-1 transition-all text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex flex-col items-center gap-1 transition-all text-xs font-semibold"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 flex flex-col items-center gap-1 transition-all text-xs font-semibold"
                >
                  <Twitter className="w-4 h-4" />
                  X / Twitter
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 flex flex-col items-center gap-1 transition-all text-xs font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Telegram
                </button>
              </div>
            </div>

            {/* Reward Policy Info */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2.5 text-xs text-content-muted">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>How it works:</strong> When a developer joins using your link and publishes their first APK to AppOrbit, you automatically receive <strong>+1 Permanent App Publishing Slot</strong> on your account!
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReferralModal;
