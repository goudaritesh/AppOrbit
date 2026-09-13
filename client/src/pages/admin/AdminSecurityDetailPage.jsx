import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Ban,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import SecurityStatusBadge from '../../components/security/SecurityStatusBadge';
import RiskScoreGauge from '../../components/security/RiskScoreGauge';
import FindingsList from '../../components/security/FindingsList';
import ActionReasonModal from '../../components/admin/ActionReasonModal';

/**
 * Admin Security Review Detail & Decision Dossier (Phase 7 Production Implementation)
 */
export const AdminSecurityDetailPage = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisionModal, setDecisionModal] = useState(null); // 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'ESCALATED' | 'FALSE_POSITIVE'
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSecurityReportById(reportId);
      setReport(res.data?.report || null);
    } catch (err) {
      console.error('Failed to load security report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleDecisionSubmit = async ({ reason }) => {
    try {
      setActionLoading(true);
      await adminApi.submitSecurityReview(reportId, {
        decision: decisionModal,
        reason,
      });
      await fetchReport();
      setDecisionModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Review decision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const copyDigest = () => {
    if (report?.fileHash) {
      navigator.clipboard.writeText(report.fileHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-content-muted font-mono animate-pulse">
        Loading security inspection dossier...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center">
        <p className="text-content-muted mb-4">Security report not found.</p>
        <Link to="/admin/security" className="text-primary hover:underline text-sm font-semibold">
          ← Return to Security Review Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/security"
            className="p-2 rounded-xl border border-white/10 text-content-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-heading font-extrabold text-content-primary">
                Security Dossier: {report.app?.name || 'Application'}
              </h1>
              <SecurityStatusBadge status={report.status} />
            </div>
            <p className="text-xs font-mono text-content-muted">
              Package: {report.packageName} • Version v{report.version?.versionName} (#{report.version?.versionCode})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setDecisionModal('APPROVED')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Clean</span>
          </button>

          <button
            onClick={() => setDecisionModal('FALSE_POSITIVE')}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mark False Positive</span>
          </button>

          <button
            onClick={() => setDecisionModal('ESCALATE')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Escalate</span>
          </button>

          <button
            onClick={() => setDecisionModal('REJECTED')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Version</span>
          </button>

          <button
            onClick={() => setDecisionModal('QUARANTINED')}
            className="px-3.5 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-4 h-4" />
            <span>Quarantine</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Subsystems Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Subsystem Verification Results
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="font-mono text-content-muted block">SHA-256 Storage Integrity</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {report.subsystems?.integrity?.match ? 'DIGEST VERIFIED (MATCH)' : 'MISMATCH DETECTED'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="font-mono text-content-muted block">Malware Engine</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {report.subsystems?.malware?.threatDetected ? 'THREAT FOUND' : 'NO THREATS DETECTED'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="font-mono text-content-muted block">Signature Schemes</span>
                <span className="font-mono text-content-primary">
                  {report.subsystems?.signature?.signatureSchemes?.join(', ') || 'Unsigned'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="font-mono text-content-muted block">Certificate Fingerprint</span>
                <span className="font-mono text-content-primary truncate block max-w-[220px]">
                  {report.subsystems?.certificate?.sha256Fingerprint || 'None'}
                </span>
              </div>
            </div>

            {/* SHA-256 Copyable */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-content-muted">Authoritative SHA-256:</span>
              <div className="flex items-center gap-2">
                <span className="text-content-primary bg-surface-elevated px-2 py-1 rounded border border-white/10 truncate max-w-sm">
                  {report.fileHash}
                </span>
                <button
                  onClick={copyDigest}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-content-muted hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Findings List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Security Findings ({report.findings?.length || 0})
            </h3>
            <FindingsList findings={report.findings || []} />
          </div>
        </div>

        {/* Right Sidebar: Risk Gauge */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Platform Risk Score
            </h3>
            <RiskScoreGauge score={report.riskScore || 0} level={report.riskLevel || 'LOW'} />
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 text-xs">
            <h4 className="font-heading font-bold text-content-primary uppercase font-mono">
              Report Metadata
            </h4>
            <div className="flex justify-between">
              <span className="text-content-muted font-mono">Scanner Duration</span>
              <span className="text-content-primary font-mono">{report.scanDurationSeconds || 0}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted font-mono">Threat Count</span>
              <span className="text-content-primary font-mono">{report.threatCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted font-mono">Review Required</span>
              <span className="text-content-primary font-mono">
                {report.manualReviewRequired ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted font-mono">Evaluated At</span>
              <span className="text-content-primary font-mono">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ActionReasonModal
        isOpen={Boolean(decisionModal)}
        onClose={() => setDecisionModal(null)}
        onSubmit={handleDecisionSubmit}
        title={`Confirm Decision: ${decisionModal}`}
        description={`Record human review decision for this version. Mandatory for rejections, quarantines, and escalations.`}
        confirmText="Submit Verdict"
        confirmVariant={
          decisionModal === 'APPROVED' || decisionModal === 'FALSE_POSITIVE'
            ? 'primary'
            : decisionModal === 'ESCALATE'
            ? 'warning'
            : 'danger'
        }
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminSecurityDetailPage;
