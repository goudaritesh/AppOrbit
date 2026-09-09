import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  FileCode,
  Calendar,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import SecurityStatusBadge from '../../components/security/SecurityStatusBadge';
import ActionReasonModal from '../../components/admin/ActionReasonModal';

/**
 * Admin Application Review & Moderation Page (Phase 7 Production Implementation)
 * 6-section deep dive: Overview, Content/Media, Versions, Security Summary, Review History, and Admin Actions.
 */
export const AdminAppReviewPage = () => {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [securityReports, setSecurityReports] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'APPROVE' | 'REJECT' | 'CHANGES' | 'BLOCK'

  const fetchAppDetails = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAppById(appId);
      const data = res.data?.data;
      setApp(data.app);
      setVersions(data.versions || []);
      setSecurityReports(data.securityReports || []);
      setReviewHistory(data.reviewHistory || []);
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppDetails();
  }, [appId]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await adminApi.approveApp(appId, { publishImmediately: true });
      await fetchAppDetails();
      setModalType(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionSubmit = async (params) => {
    try {
      setActionLoading(true);
      if (modalType === 'REJECT') {
        await adminApi.rejectApp(appId, params);
      } else if (modalType === 'CHANGES') {
        await adminApi.requestChanges(appId, params);
      } else if (modalType === 'BLOCK') {
        await adminApi.blockApp(appId, params);
      }
      await fetchAppDetails();
      setModalType(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-content-muted font-mono animate-pulse">
        Loading comprehensive application dossier...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-12 text-center">
        <p className="text-content-muted mb-4">Application not found.</p>
        <Link to="/admin/apps" className="text-primary hover:underline text-sm font-semibold">
          ← Return to Review Queue
        </Link>
      </div>
    );
  }

  const currentVersion = app.currentVersion || versions[0];
  const latestSecurityReport = securityReports[0];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/apps"
            className="p-2 rounded-xl border border-white/10 text-content-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src={app.icon || '/placeholder-app.png'}
              alt={app.name}
              className="w-12 h-12 rounded-2xl object-cover bg-surface border border-white/10"
              onError={(e) => {
                e.target.src = '/placeholder-app.png';
              }}
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-heading font-extrabold text-content-primary">
                  {app.name}
                </h1>
                <AdminBadge status={app.status} />
              </div>
              <p className="text-xs font-mono text-content-muted">
                {app.packageName || app.slug} • Developer: {app.developer?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {app.status !== 'PUBLISHED' && app.status !== 'APPROVED' && (
            <button
              onClick={() => setModalType('APPROVE')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Publish</span>
            </button>
          )}

          <button
            onClick={() => setModalType('CHANGES')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Changes</span>
          </button>

          <button
            onClick={() => setModalType('REJECT')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          {app.status !== 'BLOCKED' && (
            <button
              onClick={() => setModalType('BLOCK')}
              className="px-3.5 py-2 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Block App</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'overview', label: 'Overview & Metadata' },
          { id: 'content', label: 'Content & Media' },
          { id: 'versions', label: `Versions (${versions.length})` },
          { id: 'security', label: 'Security Assessment' },
          { id: 'history', label: `Review History (${reviewHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white font-semibold'
                : 'text-content-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Application Identity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-content-muted block font-mono">Category</span>
                <span className="font-medium text-content-primary">
                  {app.category?.name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-mono">Platform</span>
                <span className="font-medium text-content-primary">{app.platform}</span>
              </div>
              <div>
                <span className="text-content-muted block font-mono">Package Name</span>
                <span className="font-mono text-content-primary">
                  {app.packageName || 'Not detected'}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-mono">Total Downloads</span>
                <span className="font-mono text-content-primary">
                  {(app.downloadCount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-mono">Created Date</span>
                <span className="text-content-primary">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-mono">Last Updated</span>
                <span className="text-content-primary">
                  {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <span className="text-xs text-content-muted block font-mono mb-1">
                Short Description
              </span>
              <p className="text-xs text-content-primary">{app.shortDescription}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Developer Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-content-primary">
                {app.developer?.name?.[0] || 'D'}
              </div>
              <div>
                <div className="font-bold text-sm text-content-primary">{app.developer?.name}</div>
                <div className="text-xs font-mono text-content-muted">{app.developer?.email}</div>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Account Status</span>
                <AdminBadge status={app.developer?.accountStatus || 'ACTIVE'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Developer Member Since</span>
                <span className="text-content-primary">
                  {app.developer?.createdAt
                    ? new Date(app.developer.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <Link
                to={`/admin/developers/${app.developer?._id}`}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Full Developer Dossier</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT & MEDIA */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Full Application Description
            </h3>
            <p className="text-xs text-content-muted leading-relaxed whitespace-pre-line">
              {app.description || 'No extended description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
              <h4 className="font-heading font-bold text-xs text-content-primary uppercase font-mono">
                Key Features ({app.features?.length || 0})
              </h4>
              <ul className="list-disc list-inside text-xs text-content-muted space-y-1">
                {(app.features || []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
              <h4 className="font-heading font-bold text-xs text-content-primary uppercase font-mono">
                Technologies Stack ({app.technologies?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(app.technologies || []).map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-surface-elevated border border-white/10 text-xs text-content-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {app.screenshots?.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Screenshots ({app.screenshots.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {app.screenshots.map((s, i) => (
                  <a key={i} href={s} target="_blank" rel="noreferrer">
                    <img
                      src={s}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-44 rounded-xl object-cover border border-white/10 hover:border-primary transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERSIONS */}
      {activeTab === 'versions' && (
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface/50 text-content-muted font-mono uppercase">
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Build Code</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Processing</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4">Download Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {versions.map((v) => (
                <tr key={v._id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-content-primary">v{v.versionName}</td>
                  <td className="py-3 px-4 text-content-muted">#{v.versionCode}</td>
                  <td className="py-3 px-4 text-content-muted">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-content-muted">
                    {((v.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
                  </td>
                  <td className="py-3 px-4">
                    <AdminBadge status={v.processingStatus} />
                  </td>
                  <td className="py-3 px-4">
                    <SecurityStatusBadge status={v.securityStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <AdminBadge status={v.downloadStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SECURITY SUMMARY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {latestSecurityReport ? (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-content-primary">
                    Automated APK Inspection Verdict
                  </h3>
                  <p className="text-xs text-content-muted">
                    Report evaluated at {new Date(latestSecurityReport.createdAt).toLocaleString()}
                  </p>
                </div>
                <SecurityStatusBadge status={latestSecurityReport.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-surface border border-white/5">
                  <span className="text-content-muted font-mono block">Platform Risk</span>
                  <span className="font-bold text-content-primary">
                    {latestSecurityReport.riskScore || 0} / 100 ({latestSecurityReport.riskLevel || 'LOW'})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-white/5">
                  <span className="text-content-muted font-mono block">Integrity Verdict</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {latestSecurityReport.subsystems?.integrity?.match ? 'VALID' : 'MISMATCH'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-white/5">
                  <span className="text-content-muted font-mono block">Malware Engine</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {latestSecurityReport.subsystems?.malware?.threatDetected ? 'THREAT FOUND' : 'CLEAN'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-white/5">
                  <span className="text-content-muted font-mono block">Signature Schemes</span>
                  <span className="font-bold text-content-primary font-mono">
                    {latestSecurityReport.subsystems?.signature?.signatureSchemes?.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/admin/security/${latestSecurityReport._id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Deep Security Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center text-content-muted text-xs font-mono">
              No automated security report on record for this application release.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REVIEW HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-heading font-bold text-sm text-content-primary">
            Application Moderation Audit Log
          </h3>

          {reviewHistory.length === 0 ? (
            <p className="text-xs text-content-muted font-mono">No review events logged yet.</p>
          ) : (
            <div className="space-y-3 font-sans">
              {reviewHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface border border-white/5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AdminBadge status={item.action} />
                      <span className="text-xs font-mono text-content-muted">
                        by {item.adminName || 'Admin'} ({item.adminEmail || 'system'})
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-xs text-content-primary mt-1">{item.reason}</p>
                    )}
                    {item.category && (
                      <span className="text-[10px] font-mono text-amber-400 block">
                        Category: {item.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-content-muted shrink-0">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Modals */}
      {modalType === 'APPROVE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-content-primary">
              Approve & Publish Application?
            </h3>
            <p className="text-xs text-content-muted">
              Approving "{app.name}" will designate it as PUBLISHED, make it publicly visible in
              the marketplace, and enable download token generation for consumers.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-content-muted text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionReasonModal
        isOpen={modalType === 'REJECT'}
        onClose={() => setModalType(null)}
        onSubmit={handleActionSubmit}
        title="Reject Application"
        description="Specify the violation category and clear feedback for the developer."
        confirmText="Reject Application"
        confirmVariant="danger"
        showCategory={true}
        categories={['CONTENT', 'SECURITY', 'POLICY', 'TECHNICAL', 'DUPLICATE', 'PAYMENT', 'OTHER']}
        loading={actionLoading}
      />

      <ActionReasonModal
        isOpen={modalType === 'CHANGES'}
        onClose={() => setModalType(null)}
        onSubmit={handleActionSubmit}
        title="Request Changes"
        description="Provide actionable revision instructions for the developer."
        confirmText="Submit Request"
        confirmVariant="warning"
        loading={actionLoading}
      />

      <ActionReasonModal
        isOpen={modalType === 'BLOCK'}
        onClose={() => setModalType(null)}
        onSubmit={handleActionSubmit}
        title="Block Application"
        description="Immediately removes application from distribution and denies download access."
        confirmText="Block Application"
        confirmVariant="danger"
        showCategory={true}
        categories={['MALWARE', 'SECURITY_RISK', 'COPYRIGHT', 'POLICY_VIOLATION', 'FRAUD', 'OTHER']}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminAppReviewPage;
