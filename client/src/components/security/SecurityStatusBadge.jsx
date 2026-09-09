import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Clock,
  Loader2,
  Lock,
  Ban,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

/**
 * Security Status Badge (Phase 6 Production Implementation)
 * Provides professional, accessible visual security indicators without misleading claims.
 */
export const SecurityStatusBadge = ({ status, size = 'sm', showDescription = false }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size] || 'w-3.5 h-3.5';

  const config = {
    PASSED: {
      label: 'Security Checks Completed',
      shortLabel: 'Passed Checks',
      description: 'Passed automated integrity, signature, and malware analysis.',
      icon: ShieldCheck,
      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    APPROVED: {
      label: 'Security Verified',
      shortLabel: 'Verified',
      description: 'Approved by AppOrbit security moderation.',
      icon: CheckCircle2,
      classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald/10',
    },
    PENDING_SCAN: {
      label: 'Scan Queued',
      shortLabel: 'Queued',
      description: 'Waiting in security inspection pipeline.',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    SCANNING: {
      label: 'Scanning Artifact...',
      shortLabel: 'Scanning',
      description: 'Malware and signature scanning in progress.',
      icon: Loader2,
      spin: true,
      classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse',
    },
    ANALYZING: {
      label: 'Static Analysis In Progress...',
      shortLabel: 'Analyzing',
      description: 'Evaluating permission combinations and static risk factors.',
      icon: Loader2,
      spin: true,
      classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 animate-pulse',
    },
    SUSPICIOUS: {
      label: 'Suspicious Indicators Detected',
      shortLabel: 'Suspicious',
      description: 'Automated scanners flagged heuristic warnings.',
      icon: AlertTriangle,
      classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    PENDING_MANUAL_REVIEW: {
      label: 'Security Review Required',
      shortLabel: 'Review Required',
      description: 'Requires platform team evaluation before release.',
      icon: AlertCircle,
      classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    },
    MALICIOUS: {
      label: 'Malicious Threat Detected',
      shortLabel: 'Malicious',
      description: 'Confirmed threat signatures detected. Distribution blocked.',
      icon: ShieldAlert,
      classes: 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold',
    },
    QUARANTINED: {
      label: 'Quarantined Artifact',
      shortLabel: 'Quarantined',
      description: 'File is isolated in quarantine storage. Access restricted.',
      icon: Lock,
      classes: 'bg-red-950/60 text-red-400 border-red-500/40 font-bold',
    },
    BLOCKED: {
      label: 'Distribution Blocked',
      shortLabel: 'Blocked',
      description: 'Cannot be published due to security policy violations.',
      icon: Ban,
      classes: 'bg-rose-900/30 text-rose-300 border-rose-600/30',
    },
    FAILED: {
      label: 'Inspection Failed',
      shortLabel: 'Scan Failed',
      description: 'Automated scan pipeline encountered an unrecoverable error.',
      icon: XCircle,
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    NOT_SCANNED: {
      label: 'Not Scanned',
      shortLabel: 'Not Scanned',
      description: 'Security inspection has not been initiated.',
      icon: HelpCircle,
      classes: 'bg-white/5 text-content-dim border-white/10',
    },
  }[status] || {
    label: status || 'Pending Inspection',
    shortLabel: status || 'Pending',
    description: 'Security evaluation pending.',
    icon: Clock,
    classes: 'bg-white/5 text-content-dim border-white/10',
  };

  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center font-medium rounded-full border ${config.classes} ${sizeClasses}`}
        title={`${config.label}: ${config.description}`}
      >
        <Icon className={`${iconSizes} ${config.spin ? 'animate-spin' : ''}`} />
        <span>{size === 'xs' ? config.shortLabel : config.label}</span>
      </span>
      {showDescription && (
        <p className="text-[11px] text-content-secondary mt-0.5">{config.description}</p>
      )}
    </div>
  );
};

export default SecurityStatusBadge;
