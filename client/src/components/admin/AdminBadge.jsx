import React from 'react';

/**
 * Reusable Admin Status Badge Component
 */
export const AdminBadge = ({ status, type = 'app' }) => {
  const normalized = (status || '').toUpperCase();

  const getStyles = () => {
    switch (normalized) {
      // Clean / Active / Success
      case 'PUBLISHED':
      case 'APPROVED':
      case 'ACTIVE':
      case 'SUCCESS':
      case 'PASSED':
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

      // Pending / In Review
      case 'PENDING_REVIEW':
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
      case 'PENDING':
      case 'PROCESSING':
      case 'IN_PROGRESS':
      case 'IN_REVIEW':
      case 'OPEN':
      case 'WAITING_FOR_USER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

      // Warning / Changes
      case 'CHANGES_REQUESTED':
      case 'SUSPICIOUS':
      case 'MANUAL_REVIEW':
      case 'RESTRICTED':
      case 'PENDING_MANUAL_REVIEW':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';

      // Danger / Blocked / Malicious
      case 'REJECTED':
      case 'BLOCKED':
      case 'QUARANTINED':
      case 'MALICIOUS':
      case 'SUSPENDED':
      case 'BANNED':
      case 'FAILED':
      case 'CANCELLED':
      case 'DISMISSED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      // Neutral / Draft / Expired
      case 'DRAFT':
      case 'ARCHIVED':
      case 'EXPIRED':
      case 'CLOSED':
      default:
        return 'bg-white/5 text-content-muted border-white/10';
    }
  };

  const formatText = (text) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border uppercase tracking-wider ${getStyles()}`}
    >
      {formatText(normalized)}
    </span>
  );
};

export default AdminBadge;
