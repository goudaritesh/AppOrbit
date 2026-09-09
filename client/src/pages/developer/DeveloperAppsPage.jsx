import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Eye,
  FileEdit,
  Send,
  Archive,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Boxes,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ApplicationStatusBadge from '../../components/developer/ApplicationStatusBadge';
import Modal from '../../components/ui/Modal';
import {
  getDeveloperApps,
  deleteApp,
  submitApp,
  archiveApp,
  restoreApp,
} from '../../api/developerPortalApi';
import { getCategories } from '../../api/categoriesApi';
import { formatNumber, formatDate } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'REJECTED', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recently Updated' },
  { value: 'createdAt', label: 'Recently Created' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'downloadCount', label: 'Most Downloaded' },
  { value: 'viewCount', label: 'Most Viewed' },
];

export const DeveloperAppsPage = () => {
  const navigate = useNavigate();

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [page, setPage] = useState(1);

  // Data
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    btnVariant: 'primary',
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data?.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch applications
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sort: sortBy,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCategory) params.category = selectedCategory;

      const res = await getDeveloperApps(params);
      setApps(res.data?.apps || []);
      setPagination(res.data?.pagination || { page, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load developer apps:', err);
      setFeedback({ type: 'error', message: 'Unable to load applications list.' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedStatus, selectedCategory, sortBy, page]);

  useEffect(() => {
    document.title = 'My Applications — AppOrbit';
    fetchApps();
  }, [fetchApps]);

  // Action Handlers
  const handleSubmitForReview = async (appId) => {
    setActionLoading(true);
    try {
      await submitApp(appId);
      setFeedback({ type: 'success', message: 'Application submitted for review successfully!' });
      fetchApps();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit application.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (appId) => {
    setActionLoading(true);
    try {
      await archiveApp(appId);
      setFeedback({ type: 'success', message: 'Application moved to archive.' });
      fetchApps();
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

  const handleRestore = async (appId) => {
    setActionLoading(true);
    try {
      await restoreApp(appId);
      setFeedback({ type: 'success', message: 'Application restored to draft status.' });
      fetchApps();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to restore application.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDraft = async (appId) => {
    setActionLoading(true);
    try {
      await deleteApp(appId);
      setFeedback({ type: 'success', message: 'Application draft permanently deleted.' });
      fetchApps();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete application draft.',
      });
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            My Applications
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Manage your Android application releases, review statuses, and metadata.
          </p>
        </div>

        <Link to="/developer/apps/create">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Create Application
          </Button>
        </Link>
      </div>

      {/* Alert / Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'error'
              ? 'bg-accent-rose/10 border border-accent-rose/20 text-accent-rose'
              : 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. FILTERS & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-white/10">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search applications by name or tag..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="" className="bg-surface">
              All Categories
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug} className="bg-surface">
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. APPLICATIONS DATA TABLE */}
      <Card padding="none" className="overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-content-muted flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span>Loading applications...</span>
          </div>
        ) : apps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/70 border-b border-white/10 text-content-muted font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Downloads</th>
                  <th className="py-3.5 px-4 font-semibold">Updated</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-content-secondary">
                {apps.map((app) => (
                  <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Name & Icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 overflow-hidden">
                          {app.icon ? (
                            <img src={app.icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            app.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/developer/apps/${app._id}`}
                            className="font-bold text-content-primary hover:text-primary transition-colors block truncate"
                          >
                            {app.name}
                          </Link>
                          <span className="text-[11px] text-content-dim font-mono truncate block">
                            /{app.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-mono text-content-muted">
                      {app.category?.name || 'General'}
                    </td>

                    {/* Platform */}
                    <td className="py-3.5 px-4 font-mono text-content-dim">
                      {app.platform || 'ANDROID'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>

                    {/* Downloads */}
                    <td className="py-3.5 px-4 font-mono text-content-primary">
                      {formatNumber(app.downloadCount || 0)}
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 font-mono text-content-dim">
                      {formatDate(app.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <Link to={`/developer/apps/${app._id}`}>
                          <button
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-white transition-colors"
                            title="View Application Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        {/* Edit (Allowed on all except suspended) */}
                        {app.status !== 'SUSPENDED' && (
                          <Link to={`/developer/apps/${app._id}/edit`}>
                            <button
                              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-white transition-colors"
                              title="Edit Application"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        )}

                        {/* Submit for Review (DRAFT or REJECTED) */}
                        {(app.status === 'DRAFT' || app.status === 'REJECTED') && (
                          <button
                            onClick={() => handleSubmitForReview(app._id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Submit for Review"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Archive (DRAFT, PUBLISHED, REJECTED) */}
                        {app.status !== 'ARCHIVED' && app.status !== 'PENDING_REVIEW' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                title: `Archive ${app.name}?`,
                                message:
                                  'Archiving will remove this application from discovery while retaining all history.',
                                btnVariant: 'warning',
                                action: () => handleArchive(app._id),
                              })
                            }
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-amber-400 transition-colors"
                            title="Archive Application"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Restore (ARCHIVED) */}
                        {app.status === 'ARCHIVED' && (
                          <button
                            onClick={() => handleRestore(app._id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-accent-cyan transition-colors"
                            title="Restore to Draft"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete (DRAFT only) */}
                        {app.status === 'DRAFT' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                title: `Delete Draft ${app.name}?`,
                                message:
                                  'This action will permanently delete this draft application listing. It cannot be undone.',
                                btnVariant: 'destructive',
                                action: () => handleDeleteDraft(app._id),
                              })
                            }
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-accent-rose/20 text-content-muted hover:text-accent-rose transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Boxes className="w-10 h-10 text-content-dim" />
            <div className="flex flex-col gap-1">
              <span className="font-heading font-bold text-content-primary">
                No applications found
              </span>
              <span className="text-xs text-content-muted">
                {searchInput || selectedStatus || selectedCategory
                  ? 'No applications match your active filter criteria.'
                  : 'You have not created any applications yet.'}
              </span>
            </div>
            {searchInput || selectedStatus || selectedCategory ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setSelectedStatus('');
                  setSelectedCategory('');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Link to="/developer/apps/create" className="mt-2">
                <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  Create Application
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* PAGINATION BAR */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-surface-elevated/40 border-t border-white/5 flex items-center justify-between text-xs font-mono text-content-dim">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. CONFIRMATION DIALOG MODAL */}
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

export default DeveloperAppsPage;
