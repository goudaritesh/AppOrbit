import React from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * Structured Security Findings List Component
 */
export const FindingsList = ({ findings = [] }) => {
  if (!findings || findings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-surface-low/80 border border-white/10 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-content-primary">No Anomalies Detected</h4>
        <p className="text-xs text-content-secondary mt-1">
          Automated analysis did not detect any threats, signature issues, or policy violations.
        </p>
      </div>
    );
  }

  const severityConfig = {
    CRITICAL: {
      icon: ShieldAlert,
      classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    HIGH: {
      icon: AlertCircle,
      classes: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    MEDIUM: {
      icon: AlertTriangle,
      classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    LOW: {
      icon: Info,
      classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    INFO: {
      icon: Info,
      classes: 'bg-white/5 text-content-secondary border-white/10',
      badgeClass: 'bg-white/10 text-content-secondary border-white/15',
    },
  };

  return (
    <div className="space-y-3">
      {findings.map((item, idx) => {
        const conf = severityConfig[item.severity] || severityConfig.INFO;
        const Icon = conf.icon;

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${conf.classes}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${conf.badgeClass}`}>
                  {item.severity}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-content-dim">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-medium text-content-primary">
                  {item.code}
                </span>
                {item.requiresReview && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                    Review Required
                  </span>
                )}
              </div>
              <p className="text-xs text-content-primary leading-relaxed">{item.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FindingsList;
