import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Crown,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscriptionApi';
import { setCurrentSubscription, setUsage } from '../../store/slices/subscriptionSlice';
import Button from '../../components/ui/Button';

export const DeveloperSubscriptionPage = () => {
  const dispatch = useDispatch();
  const { currentSubscription, usage } = useSelector((state) => state.subscription);

  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subRes, usageRes] = await Promise.all([
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getUsage(),
      ]);

      if (subRes?.data?.subscription) {
        dispatch(setCurrentSubscription(subRes.data.subscription));
      }
      if (usageRes?.data?.usage) {
        dispatch(setUsage(usageRes.data.usage));
      }
    } catch (err) {
      toast.error('Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      await subscriptionApi.cancelSubscription(cancelReason);
      toast.success('Auto-renewal cancelled. Your plan remains active until the billing cycle ends.');
      setCancelModalOpen(false);
      await loadSubscriptionData();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  const planName = usage?.planName || currentSubscription?.plan?.name || 'Free Tier';
  const planSlug = usage?.planSlug || currentSubscription?.planSlug || 'free';
  const isFree = planSlug === 'free';
  const isActive = currentSubscription?.status === 'ACTIVE' || isFree;
  const status = currentSubscription?.status || 'ACTIVE';

  const usedApps = usage?.applicationsUsed ?? 0;
  const totalLimit = usage?.appsLimit ?? 1;
  const remainingApps = usage?.remainingApps ?? 0;
  const percentUsed = Math.min(100, Math.round((usedApps / totalLimit) * 100));

  const expirationDateStr = currentSubscription?.endDate || currentSubscription?.expiresAt;
  const formattedExpiry = expirationDateStr
    ? new Date(expirationDateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Lifetime / Continuous';

  const resetDateStr = usage?.resetDate || currentSubscription?.usageResetDate;
  const formattedReset = resetDateStr
    ? new Date(resetDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'At Next Billing Cycle';

  return (
    <div className="space-y-8 pb-16 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Crown className="w-4 h-4" />
            <span>Developer Account Tier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary">
            Workspace Subscription & Limits
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/developer/pricing">
            <Button variant="primary" size="md" icon={<ArrowUpRight className="w-4 h-4" />}>
              Upgrade Tier
            </Button>
          </Link>
          <Link to="/developer/payments">
            <Button variant="secondary" size="md" icon={<CreditCard className="w-4 h-4" />}>
              Payment History
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-content-dim">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading workspace metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Status Card */}
          <div className="lg:col-span-1 rounded-3xl bg-surface-low border border-white/10 p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-content-dim">Current Tier</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {status}
              </span>
            </div>

            <div>
              <div className="text-3xl font-heading font-black text-content-primary tracking-tight">
                {planName}
              </div>
              <div className="text-xs text-content-dim mt-1">
                {isFree
                  ? 'Standard Developer Sandbox'
                  : `₹${currentSubscription?.plan?.price || 399} / ${
                      currentSubscription?.billingPeriod?.toLowerCase() || 'month'
                    }`}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-content-dim">Cycle Expiration</span>
                <span className="font-semibold text-content-primary font-mono">{formattedExpiry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-dim">Auto Renewal</span>
                <span className="font-semibold text-content-primary font-mono">
                  {currentSubscription?.autoRenew ? 'Active (Auto)' : 'Manual / Disabled'}
                </span>
              </div>
              {currentSubscription?.scheduledPlanChange && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  Scheduled Downgrade at end of cycle: Plan ID {currentSubscription.scheduledPlanChange.planId}
                </div>
              )}
            </div>

            {!isFree && currentSubscription?.autoRenew && (
              <div className="pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Auto Renewal
                </Button>
              </div>
            )}
          </div>

          {/* Usage Quota Card */}
          <div className="lg:col-span-2 rounded-3xl bg-surface-low border border-white/10 p-6 sm:p-7 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-content-dim">
                  Application Publishing Quota
                </span>
                <span className="text-xs font-mono text-accent-cyan font-bold">
                  Next Refresh: {formattedReset}
                </span>
              </div>

              {/* Big Metric Display */}
              <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl bg-surface border border-white/5 text-center mb-6">
                <div>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary font-mono">
                    {usedApps}
                  </div>
                  <div className="text-[11px] text-content-dim font-mono uppercase mt-1">Apps Created</div>
                </div>
                <div className="border-x border-white/5">
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-accent-cyan font-mono">
                    {remainingApps}
                  </div>
                  <div className="text-[11px] text-content-dim font-mono uppercase mt-1">Available Slots</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary font-mono">
                    {totalLimit}
                  </div>
                  <div className="text-[11px] text-content-dim font-mono uppercase mt-1">Total Tier Limit</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-content-secondary">Quota Utilization</span>
                  <span className="text-content-primary font-mono">{percentUsed}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentUsed >= 90
                        ? 'bg-accent-rose'
                        : percentUsed >= 70
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-primary to-accent-cyan'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quota Policy Notice */}
            <div className="p-4 rounded-2xl bg-surface/60 border border-white/5 flex items-start gap-3 text-xs text-content-secondary">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                App creation slots are strictly enforced atomically. Monthly quotas automatically renew on <strong className="text-content-primary">{formattedReset}</strong>. Need more app slots? Upgrade to Diamond for custom or unrestricted publishing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-surface-low border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-accent-rose text-xs font-mono font-bold uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Auto-Renewal Cancellation</span>
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-content-primary">
                Cancel subscription renewal?
              </h3>
              <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                Your <strong className="text-white">{planName}</strong> plan will remain fully active until <strong className="text-white">{formattedExpiry}</strong>. After that date, your workspace will smoothly transition to the Free tier without deleting any existing apps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-dim mb-1 font-mono">
                Reason for cancellation (optional):
              </label>
              <textarea
                rows={2}
                placeholder="Help us improve our service..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Keep Active
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                icon={cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperSubscriptionPage;
