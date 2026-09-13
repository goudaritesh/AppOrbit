import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Boxes,
  Sparkles,
  ExternalLink,
  Linkedin,
  Twitter,
  MessageCircle,
  Send,
  ArrowRight,
  Rocket,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  PENDING: { label: 'Pending', color: 'text-content-muted', bg: 'bg-surface-low' },
  REGISTERED: { label: 'Registered', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ACTIVATED_FIRST_APP: { label: '🚀 Activated', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REWARDED: { label: '🎁 Rewarded', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

export const DeveloperReferralPage = () => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Invite & Earn — AppOrbit Developer';
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMyReferrals();
      const payload = res?.data?.data || res?.data || null;
      if (payload) setReferralData(payload);
    } catch (err) {
      console.error('Failed to load referral data:', err);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const referralCode = referralData?.referralCode || '';
  const shareUrl = `${window.location.origin}/invite/${referralCode}`;
  const stats = referralData?.referralStats || { totalReferred: 0, activatedDevelopers: 0, rewardedSlots: 0 };
  const referrals = referralData?.referrals || [];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      href: `https://wa.me/?text=${encodeURIComponent(
        `Join me on AppOrbit — the indie Android app marketplace! Sign up with my invite code ${referralCode}: ${shareUrl}`
      )}`,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'Twitter / X',
      icon: Twitter,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Discover indie Android apps on AppOrbit 🚀 Join with my invite: ${shareUrl}`
      )}`,
    },
    {
      label: 'Telegram',
      icon: Send,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        `Join AppOrbit — the indie Android app marketplace! Use my invite: ${referralCode}`
      )}`,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-72 bg-surface-low rounded-xl" />
        <div className="h-48 bg-surface-low rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface-low rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-content-primary font-heading tracking-tight flex items-center gap-2">
          <Gift className="w-6 h-6 text-fuchsia-400" />
          Invite & Earn
        </h1>
        <p className="text-sm text-content-muted mt-1">
          Invite developers to AppOrbit. Earn publishing slot bonuses when they publish their first app.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-content-primary">Your Invite Code</h2>
            <p className="text-xs text-content-muted">Share this code with other developers</p>
          </div>
        </div>

        {/* Code Display */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-3 bg-surface-low border border-white/10 rounded-xl px-4 py-3">
            <code className="text-2xl font-black text-primary tracking-widest font-mono">{referralCode || 'Loading…'}</code>
          </div>
          <Button
            variant="primary"
            onClick={() => handleCopy(referralCode)}
            className="flex items-center gap-2 px-4 py-3"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Share URL */}
        <div className="flex items-center gap-2 bg-surface-low border border-white/5 rounded-lg px-3 py-2 mb-4">
          <ExternalLink className="w-3.5 h-3.5 text-content-muted flex-shrink-0" />
          <span className="text-xs text-content-muted font-mono truncate">{shareUrl}</span>
          <button
            onClick={() => handleCopy(shareUrl)}
            className="ml-auto text-xs text-primary hover:text-accent-cyan font-semibold transition-colors flex-shrink-0"
          >
            Copy Link
          </button>
        </div>

        {/* Share Buttons */}
        <div>
          <p className="text-xs text-content-muted mb-2.5 font-medium">Share directly:</p>
          <div className="flex flex-wrap gap-2">
            {shareLinks.map((sl) => {
              const Icon = sl.icon;
              return (
                <a
                  key={sl.label}
                  href={sl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${sl.color} ${sl.bg}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sl.label}
                </a>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-content-primary font-mono">{stats.totalReferred}</div>
          <div className="text-xs text-content-muted mt-1">Total Invited</div>
        </Card>
        <Card className="p-4 text-center">
          <Boxes className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-content-primary font-mono">{stats.activatedDevelopers}</div>
          <div className="text-xs text-content-muted mt-1">Published Apps</div>
        </Card>
        <Card className="p-4 text-center">
          <Award className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-content-primary font-mono">{stats.rewardedSlots}</div>
          <div className="text-xs text-content-muted mt-1">Bonus Slots Earned</div>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" /> How the Referral Program Works
        </h3>
        <div className="flex flex-col gap-3">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your invite code or link to fellow developers' },
            { step: '2', title: 'They register', desc: 'They sign up using your code — tracked instantly' },
            { step: '3', title: 'They publish an app', desc: 'When their first app goes live on AppOrbit' },
            { step: '4', title: 'You earn a bonus slot', desc: 'Get +1 extra app publishing slot as a reward' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-black text-primary flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-content-primary">{item.title}</div>
                <div className="text-xs text-content-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Referral History */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-content-primary">Referral History</h3>
          <p className="text-xs text-content-muted">{referrals.length} referrals tracked</p>
        </div>

        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <Gift className="w-10 h-10 text-content-muted/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-content-muted">No referrals yet</p>
            <p className="text-xs text-content-muted mt-1">Share your code above to start inviting developers</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Developer</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => {
                  const statusInfo = STATUS_LABELS[ref.status] || STATUS_LABELS.PENDING;
                  return (
                    <tr key={ref._id} className="border-b border-white/5 hover:bg-surface-low/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-content-primary font-semibold">{ref.referee?.name || 'Invited User'}</div>
                        <div className="text-content-muted">{ref.referee?.email || ref.refereeEmail || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-content-muted">{ref.refereeRole}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-muted font-mono">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DeveloperReferralPage;
