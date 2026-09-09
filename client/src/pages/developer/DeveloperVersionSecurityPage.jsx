import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Layers,
  Key,
  Lock,
  Cpu,
  Smartphone,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageLoader from '../../components/common/PageLoader';
import { SecurityStatusBadge } from '../../components/security/SecurityStatusBadge';
import { ScanProgressTimeline } from '../../components/security/ScanProgressTimeline';
import { RiskScoreGauge } from '../../components/security/RiskScoreGauge';
import { FindingsList } from '../../components/security/FindingsList';
import { securityApi } from '../../api/securityApi';

/**
 * Developer Version Security Analysis Deep-Dive Page
 */
export const DeveloperVersionSecurityPage = () => {
  const { appId, versionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedHash, setCopiedHash] = useState(null);

  // Review request modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const pollTimerRef = useRef(null);

  const fetchSecurityReport = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await securityApi.getSecurityReport(appId, versionId);
      setReport(data?.data?.security || null);
    } catch (err) {
      console.error('Failed to load security report:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load security report.',
      });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [appId, versionId]);

  useEffect(() => {
    fetchSecurityReport();
  }, [fetchSecurityReport]);

  // Polling listener when scan is in-progress
  useEffect(() => {
    const isScanning =
      report?.status === 'PENDING_SCAN' ||
      report?.status === 'SCANNING' ||
      report?.status === 'ANALYZING';

    if (isScanning) {
      pollTimerRef.current = setTimeout(async () => {
        try {
          const statusRes = await securityApi.getSecurityStatus(appId, versionId);
          if (statusRes?.data?.isTerminal) {
            // Finished! Reload full report
            fetchSecurityReport(true);
          } else {
            // Keep polling
            fetchSecurityReport(true);
          }
        } catch {
          fetchSecurityReport(true);
        }
      }, 3500);
    }

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [report?.status, appId, versionId, fetchSecurityReport]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewReason.trim() || reviewReason.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'Please provide a detailed reason (minimum 10 characters) for manual review.',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      await securityApi.requestReview(appId, versionId, { reason: reviewReason });
      setFeedback({
        type: 'success',
        message: 'Security review request submitted successfully. Our security team has been notified.',
      });
      setShowReviewModal(false);
      setReviewReason('');
      fetchSecurityReport(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to submit review request.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading security analysis report..." />;
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-content-primary">Security Report Unavailable</h2>
        <p className="text-sm text-content-secondary mt-1">
          No security inspection report could be found for this release artifact.
        </p>
        <Link to={`/developer/apps/${appId}/versions`} className="inline-block mt-4">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Versions
          </Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Findings' },
    { id: 'integrity', label: 'Integrity & Hash' },
    { id: 'malware', label: 'Malware Scan' },
    { id: 'signature', label: 'Signatures & Certs' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'static', label: 'Static Analysis' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to={`/developer/apps/${appId}/versions`}
            className="inline-flex items-center gap-2 text-xs font-mono text-content-secondary hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Versions</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-heading font-black text-content-primary tracking-tight">
              Security Inspection
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-sm font-bold font-mono text-content-primary">
              v{report.versionName}
            </span>
            <span className="text-xs font-mono text-content-dim">
              Build #{report.versionCode}
            </span>
          </div>
          <p className="text-xs font-mono text-content-dim mt-1 truncate max-w-xl">
            {report.packageName || 'Android Package'} • {report.originalFileName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchSecurityReport(true)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {(report.manualReviewRequired || report.status === 'SUSPICIOUS' || report.status === 'BLOCKED') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewModal(true)}
              icon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Request Manual Review
            </Button>
          )}
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-low/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <SecurityStatusBadge status={report.status} size="md" showDescription />
              {report.quarantined && (
                <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  QUARANTINED
                </span>
              )}
            </div>

            {/* Quarantine or Review Alert */}
            {report.quarantined && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-4">
                <strong>Quarantine Isolation Active:</strong> {report.quarantineReason || 'File is isolated. Public downloads and API distribution are completely disabled.'}
              </div>
            )}

            {report.manualReviewRequired && !report.quarantined && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-300 mb-4 flex items-center justify-between gap-4">
                <div>
                  <strong>Platform Review Required:</strong> {report.reviewReason || 'This release triggered security policies requiring manual evaluation.'}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowReviewModal(true)}
                  className="shrink-0"
                >
                  Submit Notes
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-content-dim block">Scan Completed</span>
                <span className="font-mono text-content-primary">
                  {report.scanCompletedAt ? new Date(report.scanCompletedAt).toLocaleString() : 'In Progress...'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-content-dim block">Analysis Duration</span>
                <span className="font-mono text-content-primary">
                  {report.executionTimeMs ? `${(report.executionTimeMs / 1000).toFixed(2)}s` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-content-dim block">Integrity Verdict</span>
                <span className={`font-mono font-bold ${report.integrity.match ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report.integrity.status}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Digest */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-content-dim block">Authoritative SHA-256 Digest</span>
              <p className="font-mono text-xs text-content-secondary truncate">{report.fileHash}</p>
            </div>
            <button
              onClick={() => handleCopy(report.fileHash)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-content-secondary hover:text-white transition-colors shrink-0"
              title="Copy SHA-256 Hash"
            >
              {copiedHash === report.fileHash ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Risk Gauge */}
        <div>
          <RiskScoreGauge score={report.riskScore} level={report.riskLevel} />
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-2 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-content-secondary hover:text-content-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div>
        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="p-6 border border-white/10">
              <h3 className="text-sm font-heading font-bold text-content-primary mb-3">
                8-Stage Inspection Pipeline Progress
              </h3>
              <ScanProgressTimeline status={report.status} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-white/10 space-y-4">
                <h3 className="text-sm font-heading font-bold text-content-primary">
                  Structured Findings ({report.findings.length})
                </h3>
                <FindingsList findings={report.findings} />
              </Card>

              <Card className="p-6 border border-white/10 space-y-4">
                <h3 className="text-sm font-heading font-bold text-content-primary">
                  Recommendations & Warnings
                </h3>
                {report.warnings.length === 0 && report.recommendations.length === 0 ? (
                  <p className="text-xs text-content-secondary">
                    No warnings or corrective recommendations recorded for this release.
                  </p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {report.warnings.map((warn, i) => (
                      <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                    {report.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* 2. Integrity & Hash */}
        {activeTab === 'integrity' && (
          <Card className="p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-content-primary">
                  Cryptographic Binary Integrity
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  Verifies that raw bytes in private storage exactly match the upload registration digest.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                report.integrity.match
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {report.integrity.match ? 'DIGEST VERIFIED' : 'INTEGRITY MISMATCH'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5 space-y-1">
                <span className="text-[10px] text-content-dim uppercase">Original Expected SHA-256</span>
                <p className="text-content-primary break-all">{report.fileHash}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5 space-y-1">
                <span className="text-[10px] text-content-dim uppercase">Storage Verified SHA-256</span>
                <p className="text-content-primary break-all">{report.integrity.verifiedHash}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 3. Malware Scan */}
        {activeTab === 'malware' && (
          <Card className="p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-content-primary">
                  Malware & Threat Heuristics
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  Multi-scanner inspection results for viruses, trojans, adware, and potentially unwanted programs.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                report.malware.detected
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {report.malware.detected ? 'THREAT DETECTED' : 'UNDETECTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Engine Verdict</span>
                <span className="font-bold text-content-primary">{report.malware.status}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Malicious Matches</span>
                <span className={`font-bold ${report.malware.maliciousCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.malware.maliciousCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Suspicious Matches</span>
                <span className={`font-bold ${report.malware.suspiciousCount > 0 ? 'text-amber-400' : 'text-content-primary'}`}>
                  {report.malware.suspiciousCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Scanned On</span>
                <span className="text-content-secondary">
                  {report.malware.scanDate ? new Date(report.malware.scanDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {report.malware.threatNames && report.malware.threatNames.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <h4 className="text-xs font-bold text-rose-300 mb-2">Detected Threat Signatures</h4>
                <ul className="list-disc list-inside text-xs font-mono text-rose-300 space-y-1">
                  {report.malware.threatNames.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* 4. Signatures & Certificates */}
        {activeTab === 'signature' && (
          <Card className="p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-content-primary">
                  APK Signatures & X.509 Certificate
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  Cryptographic verification of Android signature schemes and certificate fingerprint consistency.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                report.signature.signatureValid
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {report.signature.status}
              </span>
            </div>

            {report.certificate.certificateChanged && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Signing Certificate Mismatch:</strong> This APK was signed with a different key than previous versions. If this key rotation was intentional, submit manual review with explanation.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5 space-y-2">
                <span className="text-[10px] text-content-dim uppercase block">Signature Schemes</span>
                <p className="font-bold text-content-primary">{report.signature.scheme || 'None'}</p>
                <p className="text-content-secondary text-[11px]">{report.signature.details}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface/80 border border-white/5 space-y-2">
                <span className="text-[10px] text-content-dim uppercase block">Key Algorithm</span>
                <p className="font-bold text-content-primary">{report.certificate.algorithm || 'Unknown'}</p>
                <p className="text-content-secondary text-[11px] truncate">{report.certificate.subject}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block mb-1">Certificate SHA-256 Fingerprint</span>
                <p className="text-content-primary break-all">{report.certificate.sha256Fingerprint || 'Not available'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block mb-1">Certificate SHA-1 Fingerprint</span>
                <p className="text-content-primary break-all">{report.certificate.sha1Fingerprint || 'Not available'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 5. Permissions */}
        {activeTab === 'permissions' && (
          <Card className="p-6 border border-white/10 space-y-6">
            <div>
              <h3 className="text-sm font-heading font-bold text-content-primary">
                Declared Android Permissions ({report.permissions.all.length})
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Sensitivity tier classification and dangerous capability combination audit.
              </p>
            </div>

            {report.permissions.dangerousCombinations && report.permissions.dangerousCombinations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase text-orange-400">High Risk Permission Combinations</h4>
                {report.permissions.dangerousCombinations.map((comb, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300">
                    <span className="font-bold">{comb.name}:</span> {comb.description}
                  </div>
                ))}
              </div>
            )}

            {report.permissions.all.length === 0 ? (
              <p className="text-xs text-content-secondary">This application requests no Android permissions.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                {report.permissions.all.map((perm, idx) => {
                  const riskItem = report.permissions.riskPermissions.find((r) => r.permission === perm);
                  const risk = riskItem ? riskItem.risk : 'LOW';

                  const badgeColors = {
                    CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    LOW: 'bg-white/5 text-content-secondary border-white/10',
                  }[risk];

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${badgeColors}`}
                    >
                      <span className="truncate">{perm}</span>
                      <span className="text-[9px] uppercase font-bold shrink-0">{risk}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* 6. Static Analysis */}
        {activeTab === 'static' && (
          <Card className="p-6 border border-white/10 space-y-6">
            <div>
              <h3 className="text-sm font-heading font-bold text-content-primary">
                Non-Execution Static Code Inspection
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Inspection of Android manifest flags, exported components, native library architectures, and obfuscation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Debuggable Flag</span>
                <span className={`text-sm font-bold ${report.staticAnalysis.debuggable ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {report.staticAnalysis.debuggable ? 'TRUE (DEBUG BUILD)' : 'FALSE (RELEASE BUILD)'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Exported Components</span>
                <span className="text-sm font-bold text-content-primary">
                  {report.staticAnalysis.exportedComponentsCount} Entry Points
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5">
                <span className="text-[10px] text-content-dim uppercase block">Native Architectures</span>
                <span className="text-sm font-bold text-content-primary">
                  {report.staticAnalysis.architectures.length > 0 ? report.staticAnalysis.architectures.join(', ') : 'None (Pure DEX)'}
                </span>
              </div>
            </div>

            {report.staticAnalysis.obfuscationIndicators && report.staticAnalysis.obfuscationIndicators.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-content-secondary">
                <h4 className="font-bold text-content-primary mb-1">Obfuscation & Optimization</h4>
                {report.staticAnalysis.obfuscationIndicators.map((obf, i) => (
                  <p key={i}>{obf}</p>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Manual Review Request Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Request Security Review"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-xs text-content-secondary leading-relaxed">
            If your application was flagged due to certificate rotation, critical permissions, or high-risk heuristics that are essential for core functionality, please describe the implementation context for our security team.
          </p>

          <div>
            <label className="block text-xs font-mono uppercase text-content-dim mb-1.5">
              Review Explanation *
            </label>
            <textarea
              rows={4}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="Explain key rotation justification, permission use cases, or security mitigations..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-content-primary text-xs focus:outline-none focus:border-accent-cyan"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReviewModal(false)}
              disabled={submittingReview}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeveloperVersionSecurityPage;
