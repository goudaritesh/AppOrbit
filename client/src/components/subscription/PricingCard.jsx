import React from 'react';
import { Check, Crown, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

export const PricingCard = ({
  plan,
  isCurrentPlan,
  onSelectPlan,
  billingCycle = 'MONTHLY',
}) => {
  const isFree = plan.slug === 'free' || plan.price === 0;
  const isRecommended = plan.slug === 'gold';
  const isDiamond = plan.slug === 'diamond';

  const priceFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: plan.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(plan.price);

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
        isRecommended
          ? 'bg-gradient-to-b from-surface-elevated to-surface border-2 border-primary shadow-glow shadow-primary/10 -translate-y-1'
          : 'bg-surface-low/80 border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Popular / Recommended Pill */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[11px] font-bold font-mono tracking-wider uppercase shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommended Choice</span>
        </div>
      )}

      {isDiamond && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-bold font-mono tracking-wider uppercase shadow-md flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" />
          <span>Maximum Velocity</span>
        </div>
      )}

      <div>
        {/* Plan Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xl font-heading font-bold text-content-primary">
              {plan.name}
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              {plan.description || `${plan.name} Developer Workspace`}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDiamond
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : isRecommended
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-white/5 text-content-dim border border-white/5'
            }`}
          >
            {isDiamond ? (
              <Crown className="w-5 h-5" />
            ) : isRecommended ? (
              <Zap className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Pricing tag */}
        <div className="mb-6 flex items-baseline gap-1.5">
          <span className="text-4xl font-heading font-extrabold text-content-primary tracking-tight">
            {priceFormatted}
          </span>
          {!isFree && (
            <span className="text-xs font-mono text-content-dim">
              / {billingCycle.toLowerCase()}
            </span>
          )}
        </div>

        {/* Quota Highlight Box */}
        <div className="p-3.5 rounded-2xl bg-surface/80 border border-white/5 mb-6">
          <div className="text-[11px] font-mono text-content-dim uppercase tracking-wider mb-1">
            Publishing Quota
          </div>
          <div className="text-sm font-semibold text-content-primary flex items-center gap-2">
            <span className="text-accent-cyan font-mono text-base font-bold">
              {plan.applicationLimit || plan.appLimit}
            </span>
            <span>Application{plan.applicationLimit > 1 ? 's' : ''} Allowed</span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 mb-8">
          <div className="text-xs font-semibold text-content-muted uppercase tracking-wider font-mono">
            Included Capabilities
          </div>
          <ul className="space-y-2.5">
            {(plan.features && plan.features.length > 0
              ? plan.features
              : [
                  `Publish up to ${plan.applicationLimit || plan.appLimit} apps`,
                  'APK malware & vulnerability scanning',
                  'Version management & signed release pipeline',
                  isFree ? 'Community support' : 'Priority review queue & ticket support',
                  isDiamond ? 'Dedicated account & 99.9% uptime SLA' : 'Real-time telemetry dashboard',
                ]
            ).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-content-secondary">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-white/5">
        {isCurrentPlan ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-semibold text-content-dim font-mono">
            ✓ Currently Active Plan
          </div>
        ) : isFree ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-semibold text-content-dim font-mono">
            Default Plan
          </div>
        ) : (
          <Button
            variant={isRecommended ? 'primary' : 'secondary'}
            size="md"
            className="w-full justify-center"
            onClick={() => onSelectPlan(plan)}
          >
            {plan.price > 0 ? `Upgrade to ${plan.name}` : `Select ${plan.name}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
