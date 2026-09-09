import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Download,
  Trash2,
  Edit3,
  Star,
  Shield,
  ShieldAlert,
  Clock,
  Layers,
  FileCode,
  Smartphone,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageLoader from '../../components/common/PageLoader';
import { APKUploadZone } from '../../components/developer/APKUploadZone';
import { VersionStatusBadge } from '../../components/developer/VersionStatusBadge';
import { versionApi } from '../../api/versionApi';
import { getDeveloperApp } from '../../api/developerPortalApi';

/**
 * Developer Versions & APK Management Page
 * Complete release history, upload pipeline, release candidate selector, and binary metadata inspector.
 */
export const DeveloperVersionsPage = () => {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  // Edit notes modal
  const [editingVersion, setEditingVersion] = useState(null);
  const [editNotesText, setEditNotesText] = useState('');

  // Delete modal
  const [deletingVersion, setDeletingVersion] = useState(null);

  // Toast feedback
  const [feedback, setFeedback] = useState(null);

  const pollTimerRef = useRef(null);

  const fetchVersions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [appRes, versionsRes] = await Promise.all([
        getDeveloperApp(appId),
        versionApi.getVersions(appId),
      ]);

      setApp(appRes.data?.app || null);
      setVersions(versionsRes.data?.versions || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load version history.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Polling: If any version is PENDING or PROCESSING, poll every 3 seconds
  useEffect(() => {
    const hasActiveProcessing = versions.some(
      (v) => v.processingStatus === 'PENDING' || v.processingStatus === 'PROCESSING'
    );

    if (hasActiveProcessing) {
      pollTimerRef.current = setTimeout(() => {
        fetchVersions(true);
      }, 3000);
    }

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [versions, fetchVersions]);

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleSetCurrent = async (version) => {
    setActionLoading(true);
    try {
      await versionApi.setCurrentVersion(appId, version.id);
      setFeedback({
        type: 'success',
        message: `Version ${version.versionName} (build ${version.versionCode}) set as active release candidate!`,
      });
      fetchVersions(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to set active release candidate.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingVersion) return;
    setActionLoading(true);
    try {
      await versionApi.updateVersion(appId, editingVersion.id, { releaseNotes: editNotesText });
      setFeedback({ type: 'success', message: 'Release notes updated successfully.' });
      setEditingVersion(null);
      fetchVersions(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update release notes.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!deletingVersion) return;
    setActionLoading(true);
    try {
      await versionApi.deleteVersion(appId, deletingVersion.id);
      setFeedback({ type: 'success', message: 'Version artifact deleted successfully.' });
      setDeletingVersion(null);
      fetchVersions(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete version artifact.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (version) => {
    try {
      const res = await versionApi.getDownloadUrl(appId, version.id);
      const downloadUrl = res.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to generate download URL.',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <PageLoader message="Loading application version history..." />;

  const currentVersion = versions.find((v) => v.isCurrent);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/developer/apps/${appId}`}
            className="inline-flex items-center gap-1.5 text-xs text-content-dim hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {app?.name || 'Application Details'}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-extrabold text-2xl text-content-primary">
              APK Versions & Releases
            </h1>
            {app?.packageName && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-content-secondary">
                {app.packageName}
              </span>
            )}
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Manage binary builds, cryptographic signatures, release candidates, and package specifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVersions()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
            icon={<Plus className="w-4 h-4" />}
          >
            {showUpload ? 'Close Upload' : 'Upload New Version'}
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Upload Zone (Collapsible) */}
      {showUpload && (
        <APKUploadZone
          appId={appId}
          onUploadSuccess={(newVersion) => {
            setShowUpload(false);
            setFeedback({
              type: 'success',
              message: `APK uploaded successfully! Processing pipeline initiated for build ${newVersion.versionCode}.`,
            });
            fetchVersions(true);
          }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {/* Current Active Release Candidate Card */}
      {currentVersion ? (
        <Card className="p-6 border border-accent-cyan/30 bg-gradient-to-br from-surface to-accent-cyan/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-heading font-extrabold text-xl text-content-primary">
                    v{currentVersion.versionName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-accent-cyan/20 border border-accent-cyan/30 text-[11px] font-mono font-bold text-accent-cyan">
                    Build {currentVersion.versionCode}
                  </span>
                  <VersionStatusBadge type="current" />
                </div>
                <p className="text-xs text-content-dim font-mono mb-2">
                  Package: <span className="text-content-secondary">{currentVersion.packageName}</span> &bull; File Size:{' '}
                  <span className="text-content-secondary">{formatFileSize(currentVersion.fileSize)}</span>
                </p>
                {currentVersion.releaseNotes && (
                  <p className="text-xs text-content-secondary italic max-w-2xl">
                    &ldquo;{currentVersion.releaseNotes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <Link
                  to={`/developer/apps/${appId}/versions/${currentVersion.id}/security`}
                  className="hover:opacity-85 transition-opacity"
                  title="View detailed security report"
                >
                  <VersionStatusBadge type="security" status={currentVersion.securityStatus} />
                </Link>
                <VersionStatusBadge type="download" status={currentVersion.downloadStatus} />
              </div>
              <Link to={`/developer/apps/${appId}/versions/${currentVersion.id}/security`}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Shield className="w-4 h-4 text-accent-cyan" />}
                >
                  Security Report
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(currentVersion)}
                icon={<Download className="w-4 h-4" />}
              >
                Download APK
              </Button>
            </div>
          </div>

          {/* SHA-256 Fingerprint Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-content-dim">
              <span className="font-mono text-[11px] uppercase tracking-wider">SHA-256:</span>
              <span className="font-mono text-content-secondary truncate max-w-md">
                {currentVersion.fileHash}
              </span>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleCopyHash(currentVersion.fileHash)}
              icon={copiedHash === currentVersion.fileHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            >
              {copiedHash === currentVersion.fileHash ? 'Copied' : 'Copy Hash'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center border-dashed border-white/15 bg-surface/30">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-content-dim">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-content-primary mb-1">
            No Active Release Candidate
          </h3>
          <p className="text-xs text-content-secondary max-w-md mx-auto mb-4">
            Upload an APK binary to establish your application's package identity, version code, and release history.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpload(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Upload First Release
          </Button>
        </Card>
      )}

      {/* Version History Inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-content-primary">
              Version History
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-content-dim">
              {versions.length}
            </span>
          </div>
        </div>

        {versions.length === 0 ? (
          <Card className="p-8 text-center border border-white/10">
            <p className="text-sm text-content-secondary">No version records found for this application.</p>
          </Card>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-surface-low/80 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/90 border-b border-white/10 text-content-dim font-mono uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Version & Build</th>
                    <th className="py-3.5 px-4 font-semibold">Package Identifier</th>
                    <th className="py-3.5 px-4 font-semibold">File Size & Integrity</th>
                    <th className="py-3.5 px-4 font-semibold">Processing</th>
                    <th className="py-3.5 px-4 font-semibold">Security & Download</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-content-primary">
                  {versions.map((ver) => (
                    <tr key={ver.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Version & Build */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-content-primary">
                            v{ver.versionName}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-content-dim">
                            #{ver.versionCode}
                          </span>
                          {ver.isCurrent && <VersionStatusBadge type="current" size="xs" />}
                        </div>
                        <p className="text-[11px] text-content-dim mt-0.5">
                          Uploaded {new Date(ver.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Package Name */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-content-secondary truncate block max-w-xs" title={ver.packageName}>
                          {ver.packageName || 'Pending extraction...'}
                        </span>
                        {ver.minSdkVersion && (
                          <span className="text-[10px] text-content-dim">
                            Min SDK: API {ver.minSdkVersion}
                          </span>
                        )}
                      </td>

                      {/* Size & Hash */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-mono text-xs">{formatFileSize(ver.fileSize)}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-content-dim font-mono">
                          <span>{ver.fileHash ? `${ver.fileHash.slice(0, 10)}...` : 'Pending'}</span>
                          {ver.fileHash && (
                            <button
                              onClick={() => handleCopyHash(ver.fileHash)}
                              className="hover:text-white transition-colors"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === ver.fileHash ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Processing Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <VersionStatusBadge type="processing" status={ver.processingStatus} />
                        {ver.processingError && (
                          <p className="text-[10px] text-rose-400 mt-1 max-w-xs truncate" title={ver.processingError.message}>
                            {ver.processingError.code}: {ver.processingError.message}
                          </p>
                        )}
                      </td>

                      {/* Security & Download */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <Link
                            to={`/developer/apps/${appId}/versions/${ver.id}/security`}
                            className="hover:opacity-80 transition-opacity"
                            title="Click to view detailed security analysis report"
                          >
                            <VersionStatusBadge type="security" status={ver.securityStatus} size="xs" />
                          </Link>
                          <VersionStatusBadge type="download" status={ver.downloadStatus} size="xs" />
                        </div>
                      </td>

                      {/* Contextual Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Security Inspection */}
                          <Link
                            to={`/developer/apps/${appId}/versions/${ver.id}/security`}
                            title="View Security Inspection Report"
                          >
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-accent-cyan hover:text-white"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {/* Set Current Candidate */}
                          {!ver.isCurrent && ver.processingStatus === 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={actionLoading}
                              onClick={() => handleSetCurrent(ver)}
                              title="Designate as active release candidate"
                            >
                              Set Current
                            </Button>
                          )}

                          {/* Edit Notes */}
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingVersion(ver);
                              setEditNotesText(ver.releaseNotes || '');
                            }}
                            title="Edit release notes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Download APK */}
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDownload(ver)}
                            title="Download APK"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          {/* Delete */}
                          {!ver.isCurrent && ver.processingStatus !== 'PROCESSING' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-content-dim hover:text-rose-400"
                              onClick={() => setDeletingVersion(ver)}
                              title="Delete Version"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Release Notes Modal */}
      {editingVersion && (
        <Modal
          isOpen={Boolean(editingVersion)}
          onClose={() => setEditingVersion(null)}
          title={`Edit Release Notes — v${editingVersion.versionName} (#${editingVersion.versionCode})`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Release Notes
              </label>
              <textarea
                rows={5}
                value={editNotesText}
                onChange={(e) => setEditNotesText(e.target.value)}
                placeholder="Describe bug fixes, new features, and changes in this build..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-content-primary focus:outline-none focus:border-accent-cyan resize-none"
              />
              <p className="text-[11px] text-content-dim mt-1">
                Release notes will be presented to users on the public marketplace once approved.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="outline" size="sm" onClick={() => setEditingVersion(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={actionLoading} onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Version Confirmation Modal */}
      {deletingVersion && (
        <Modal
          isOpen={Boolean(deletingVersion)}
          onClose={() => setDeletingVersion(null)}
          title={`Delete Build #${deletingVersion.versionCode}?`}
        >
          <div className="space-y-4">
            <p className="text-sm text-content-secondary leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">v{deletingVersion.versionName} (Build #{deletingVersion.versionCode})</strong>?
              This will remove the APK binary from private cloud storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="outline" size="sm" onClick={() => setDeletingVersion(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={actionLoading}
                onClick={handleDeleteVersion}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeveloperVersionsPage;
