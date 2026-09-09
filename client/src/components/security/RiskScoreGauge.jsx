import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';

/**
 * Visual risk level gauge and score display
 */
export const RiskScoreGauge = ({ score = 0, level = 'LOW' }) => {
  const normalizedScore = Math.min(100, Math.max(0, score || 0));

  const levelConfigs = {
    LOW: {
      label: 'Low Risk',
      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      barColor: 'bg-emerald-500',
      icon: ShieldCheck,
      description: 'Satisfies AppOrbit baseline security policy without elevated indicators.',
    },
    MEDIUM: {
      label: 'Moderate Risk',
      classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
      description: 'Contains sensitive capabilities or debug indicators that warrant developer review.',
    },
    HIGH: {
      label: 'High Risk',
      classes: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      barColor: 'bg-orange-500',
      icon: AlertCircle,
      description: 'Potentially dangerous permission combinations or altered release signatures detected.',
    },
    CRITICAL: {
      label: 'Critical Risk',
      classes: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      barColor: 'bg-rose-500',
      icon: ShieldAlert,
      description: 'Severe policy violations, known malware signatures, or cryptographic mismatch.',
    },
    UNKNOWN: {
      label: 'Evaluating',
      classes: 'bg-white/10 text-content-dim border-white/10',
      barColor: 'bg-blue-500',
      icon: AlertCircle,
      description: 'Risk calculation is pending or in progress.',
    },
  }[level] || {
    label: level,
    classes: 'bg-white/10 text-content-dim border-white/10',
    barColor: 'bg-blue-500',
    icon: AlertCircle,
    description: 'Risk evaluation pending.',
  };

  const Icon = levelConfigs.icon;

  return (
    <div className="p-4 rounded-2xl bg-surface-low/80 border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-content-dim font-semibold">
          Platform Risk Evaluation
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelConfigs.classes}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{levelConfigs.label}</span>
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-black font-mono text-content-primary">
          {normalizedScore}
        </span>
        <span className="text-xs font-mono text-content-dim">/ 100 Risk Score</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${levelConfigs.barColor}`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>

      <p className="text-[11px] text-content-secondary leading-relaxed">
        {levelConfigs.description}
      </p>
    </div>
  );
};

export default RiskScoreGauge;
