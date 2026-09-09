import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Download,
  Star,
} from 'lucide-react';

/**
 * Accessible status badge for APK versions and security scanning lifecycles
 */
export const VersionStatusBadge = ({ type = 'processing', status, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  if (type === 'current') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shadow-glow-cyan/20 ${sizeClasses}`}
      >
        <Star className="w-3 h-3 fill-accent-cyan" />
        <span>Current Candidate</span>
      </span>
    );
  }

  if (type === 'processing') {
    const config = {
      PENDING: {
        label: 'Queued',
        icon: Clock,
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      },
      PROCESSING: {
        label: 'Processing APK...',
        icon: Loader2,
        classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
        spin: true,
      },
      COMPLETED: {
        label: 'Processed',
        icon: CheckCircle2,
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      FAILED: {
        label: 'Processing Failed',
        icon: XCircle,
        classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      },
    }[status] || {
      label: status || 'Unknown',
      icon: Clock,
      classes: 'bg-white/5 text-content-secondary border-white/10',
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border ${config.classes} ${sizeClasses}`}
        title={`APK Processing: ${config.label}`}
      >
        <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  if (type === 'security') {
    const config = {
      NOT_SCANNED: {
        label: 'Not Scanned',
        icon: Clock,
        classes: 'bg-white/5 text-content-dim border-white/10',
      },
      PENDING_SCAN: {
        label: 'Pending Security Scan',
        icon: Clock,
        classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      },
      SCANNING: {
        label: 'Scanning...',
        icon: Loader2,
        classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        spin: true,
      },
      PASSED: {
        label: 'Passed Scan',
        icon: ShieldCheck,
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      FAILED: {
        label: 'Security Failed',
        icon: ShieldAlert,
        classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      },
      QUARANTINED: {
        label: 'Quarantined',
        icon: ShieldAlert,
        classes: 'bg-rose-600/20 text-rose-400 border-rose-600/40 font-bold',
      },
    }[status] || {
      label: 'Pending Security Scan',
      icon: Clock,
      classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border ${config.classes} ${sizeClasses}`}
        title="Phase 6 Security & Malware Inspection"
      >
        <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  if (type === 'download') {
    const isEnabled = status === 'ENABLED';
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border ${
          isEnabled
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-white/5 text-content-dim border-white/10'
        } ${sizeClasses}`}
        title={isEnabled ? 'Public downloads enabled' : 'Public downloads disabled pending security review'}
      >
        {isEnabled ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3 text-content-dim" />}
        <span>{isEnabled ? 'Download Enabled' : 'Download Disabled'}</span>
      </span>
    );
  }

  return null;
};

export default VersionStatusBadge;
