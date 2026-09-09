import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileEdit,
  Send,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  DownloadCloud,
  Eye,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  Smartphone,
  Cpu,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ApplicationStatusBadge from '../../components/developer/ApplicationStatusBadge';
import PageLoader from '../../components/common/PageLoader';
import NotFound from '../../components/common/NotFound';
import Modal from '../../components/ui/Modal';
import {
  getDeveloperApp,
  submitApp,
  archiveApp,
  restoreApp,
  deleteApp,
} from '../../api/developerPortalApi';
import { formatNumber, formatDate } from '../../utils/formatters';

export const DeveloperAppDetailsPage = () => {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    btnVariant: 'primary',
  });

  const fetchApp = async () => {
    setLoading(true);
    try {
      const res = await getDeveloperApp(appId);
      setApp(res.data?.app || null);
      if (res.data?.app) {
        document.title = `${res.data.app.name} — Developer Management | AppOrbit`;
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appId) fetchApp();
  }, [appId]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await submitApp(appId);
      setFeedback({ type: 'success', message: 'Application submitted for review successfully!' });
      fetchApp();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit application.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await archiveApp(appId);
      setFeedback({ type: 'success', message: 'Application archived.' });
      fetchApp();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to archive application.',
      });
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false });
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await restoreApp(appId);
      setFeedback({ type: 'success', message: 'Application restored to draft status.' });
      fetchApp();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to restore application.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteApp(appId);
      navigate('/developer/apps');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete application draft.',
      });
      setActionLoading(false);
      setConfirmModal({ isOpen: false });
    }
  };

  if (loading) return <PageLoader message="Loading application details..." />;
  if (!app)
    return (
      <NotFound
        title="Application Not Found"
        message="This application does not exist or you do not have permission to view it."
      />
    );

  // Status timeline steps
  const TIMELINE = [
    { label: 'Created Draft', date: app.createdAt, done: true },
    {
      label: 'Submitted for Review',
      date: app.status !== 'DRAFT' ? app.updatedAt : null,
      done: ['PENDING_REVIEW', 'APPROVED', 'PUBLISHED'].includes(app.status),
    },
    {
      label: 'Security & Malware Scan',
      date: null,
      done: ['APPROVED', 'PUBLISHED'].includes(app.status),
      note: 'Scheduled for Phase 6',
    },
    {
      label: 'Marketplace Publication',
      date: app.publishedAt,
      done: app.status === 'PUBLISHED',
      note: 'Requires Phase 5 APK validation',
    },
  ];

  return (
    <div className="max-w-content-max mx-auto flex flex-col gap-8 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <Link
          to="/developer/apps"
          className="inline-flex items-center gap-2 text-xs font-mono text-content-muted hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Applications</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden flex-shrink-0">
              {app.icon ? (
                <img src={app.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                app.name.charAt(0)
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary truncate">
                  {app.name}
                </h1>
                <ApplicationStatusBadge status={app.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-content-muted font-mono mt-0.5">
                <span>/{app.slug}</span>
                <span>•</span>
                <span>{app.category?.name || 'General'}</span>
                <span>•</span>
                <span>{app.platform || 'ANDROID'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/developer/apps/${app._id}/edit`}>
              <Button variant="outline" size="sm" icon={<FileEdit className="w-4 h-4" />}>
                Edit Details
              </Button>
            </Link>

            {(app.status === 'DRAFT' || app.status === 'REJECTED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={actionLoading}
                icon={<Send className="w-4 h-4" />}
              >
                Submit for Review
              </Button>
            )}

            {app.status === 'PUBLISHED' && (
              <Link to={`/apps/${app.slug}`} target="_blank">
                <Button variant="ghost" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
                  Public Listing
                </Button>
              </Link>
            )}

            {app.status !== 'ARCHIVED' && app.status !== 'PENDING_REVIEW' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: `Archive ${app.name}?`,
                    message:
                      'Archiving will immediately withdraw this application from discovery.',
                    btnVariant: 'warning',
                    action: handleArchive,
                  })
                }
                icon={<Archive className="w-4 h-4 text-amber-400" />}
              >
                Archive
              </Button>
            )}

            {app.status === 'ARCHIVED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                loading={actionLoading}
                icon={<RotateCcw className="w-4 h-4 text-accent-cyan" />}
              >
                Restore
              </Button>
            )}

            {app.status === 'DRAFT' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: `Delete Draft ${app.name}?`,
                    message:
                      'This draft application listing will be permanently deleted. This cannot be undone.',
                    btnVariant: 'destructive',
                    action: handleDelete,
                  })
                }
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'error'
              ? 'bg-accent-rose/10 border border-accent-rose/20 text-accent-rose'
              : 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {/* 2. METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md" className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-content-dim">Total Downloads</span>
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-accent-cyan" />
            <span className="text-xl font-bold font-heading text-content-primary">
              {formatNumber(app.downloadCount || 0)}
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-content-dim">Marketplace Views</span>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent-purple" />
            <span className="text-xl font-bold font-heading text-content-primary">
              {formatNumber(app.viewCount || 0)}
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-content-dim">Average Rating</span>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xl font-bold font-heading text-content-primary">
              {app.ratingAverage || 0}
            </span>
            <span className="text-xs text-content-dim font-mono">
              ({formatNumber(app.ratingCount || 0)})
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-content-dim">Current Version</span>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold font-heading text-content-primary">
              v{app.currentVersion?.version || '1.0.0'}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. LIFECYCLE STATUS TIMELINE */}
      <Card padding="lg" className="flex flex-col gap-4 shadow-glass">
        <h2 className="text-sm font-heading font-bold text-content-primary pb-2 border-b border-white/5">
          Release Lifecycle Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {TIMELINE.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-elevated border border-white/5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    item.done
                      ? 'bg-accent-emerald text-white'
                      : 'bg-white/10 text-content-dim'
                  }`}
                >
                  {item.done ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    item.done ? 'text-content-primary' : 'text-content-muted'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {item.date && (
                <span className="text-[10px] font-mono text-content-dim pl-7">
                  {formatDate(item.date)}
                </span>
              )}
              {item.note && (
                <span className="text-[10px] text-primary italic pl-7">{item.note}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 3.5 APK VERSION & RELEASE MANAGEMENT */}
      <Card padding="lg" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-accent-cyan/20 bg-accent-cyan/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-content-primary">
                APK Releases & Version Pipeline
              </h2>
              {app.packageName && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-content-secondary">
                  {app.packageName}
                </span>
              )}
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Upload compiled Android packages, manage release candidates, view integrity hashes, and inspect extracted manifest parameters.
            </p>
          </div>
        </div>

        <Link to={`/developer/apps/${appId}/versions`}>
          <Button variant="primary" size="sm" icon={<Layers className="w-4 h-4" />}>
            Manage Versions
          </Button>
        </Link>
      </Card>

      {/* 4. DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, Features, Technologies */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description */}
          <Card padding="lg" className="flex flex-col gap-3">
            <h3 className="font-heading font-bold text-sm text-content-primary">
              Application Description
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-line bg-surface-elevated p-4 rounded-xl border border-white/5 font-mono">
              {app.description || app.shortDescription || 'No description provided.'}
            </p>
          </Card>

          {/* Features */}
          {app.features && app.features.length > 0 && (
            <Card padding="lg" className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Configured Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {app.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-elevated text-xs text-content-primary border border-white/5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Technologies */}
          {app.technologies && app.technologies.length > 0 && (
            <Card padding="lg" className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {app.technologies.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-3 py-1 rounded-xl bg-surface-elevated text-content-primary border border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Screenshots Preview */}
          {app.screenshots && app.screenshots.length > 0 && (
            <Card padding="lg" className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Configured Screenshots
              </h3>
              <div className="flex gap-3 overflow-x-auto py-1">
                {app.screenshots.map((s, idx) => (
                  <div
                    key={idx}
                    className="w-36 h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0"
                  >
                    <img src={s.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Technical Specs & External Links */}
        <div className="flex flex-col gap-6">
          <Card padding="lg" className="flex flex-col gap-4">
            <h3 className="font-heading font-bold text-sm text-content-primary pb-2 border-b border-white/5">
              Technical Specifications
            </h3>
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-content-muted">Target Platform</span>
                <span className="text-content-primary">{app.platform || 'ANDROID'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Version Code</span>
                <span className="text-content-primary">
                  {app.currentVersion?.versionCode || 1}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Package Size</span>
                <span className="text-content-primary">
                  {app.currentVersion?.fileSize || '15.0 MB'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Minimum OS</span>
                <span className="text-content-primary">
                  {app.currentVersion?.minAndroid || 'Android 8.0+'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Initial Created</span>
                <span className="text-content-primary">{formatDate(app.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Last Updated</span>
                <span className="text-content-primary">{formatDate(app.updatedAt)}</span>
              </div>
            </div>
          </Card>

          {/* External Links */}
          {(app.githubUrl || app.demoUrl || app.demoVideo?.url) && (
            <Card padding="lg" className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm text-content-primary pb-2 border-b border-white/5">
                External Resources
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                {app.githubUrl && (
                  <a
                    href={app.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-primary transition-colors"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {app.demoUrl && (
                  <a
                    href={app.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-primary transition-colors"
                  >
                    <span>Web Live Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {app.demoVideo?.url && (
                  <a
                    href={app.demoVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-primary transition-colors"
                  >
                    <span>Video Demonstration</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        title={confirmModal.title}
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-content-secondary leading-relaxed">{confirmModal.message}</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal({ isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.btnVariant || 'primary'}
              size="sm"
              loading={actionLoading}
              onClick={confirmModal.action}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeveloperAppDetailsPage;
