import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDataTable from '../../components/admin/AdminDataTable';
import ActionReasonModal from '../../components/admin/ActionReasonModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Flag, ShieldAlert, CheckCircle2, XCircle, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    category: 'ALL'
  });

  // Resolve Modal state
  const [resolveModal, setResolveModal] = useState({
    isOpen: false,
    report: null,
    resolutionStatus: 'RESOLVED', // 'RESOLVED' or 'DISMISSED'
  });

  // View Report Modal
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    report: null
  });

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        category: filters.category !== 'ALL' ? filters.category : undefined
      };
      const res = await adminApi.getReports(params);
      if (res.success) {
        setReports(res.data.reports || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load platform reports');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handleResolveSubmit = async ({ reason }) => {
    const report = resolveModal.report;
    if (!report) return;

    try {
      const res = await adminApi.resolveReport(report._id, {
        status: resolveModal.resolutionStatus,
        resolution: reason.trim()
      });
      if (res.success) {
        toast.success(`Report successfully marked as ${resolveModal.resolutionStatus}`);
        setResolveModal({ isOpen: false, report: null, resolutionStatus: 'RESOLVED' });
        fetchReports(pagination.page);
      }
    } catch (err) {
      console.error('Resolve report error:', err);
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  const columns = [
    {
      key: 'target',
      label: 'Reported Target',
      render: (r) => (
        <div>
          <div className="font-semibold text-white text-xs flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-surface-tertiary border border-border-primary text-[10px] uppercase text-text-muted">
              {r.targetType}
            </span>
            <span className="truncate max-w-[140px]">{r.targetId}</span>
          </div>
          <div className="text-[11px] text-text-muted truncate max-w-xs mt-0.5">
            {r.description}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
          {r.category}
        </span>
      )
    },
    {
      key: 'reporter',
      label: 'Reporter',
      render: (r) => (
        <div className="text-xs">
          <div className="text-white font-medium">
            {r.reporter?.fullName || r.reporter?.name || 'Anonymous / Community'}
          </div>
          <div className="text-text-muted text-[11px]">{r.reporter?.email || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <AdminBadge status={r.status} />
    },
    {
      key: 'date',
      label: 'Reported Date',
      render: (r) => (
        <span className="text-xs text-text-secondary">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => {
        const isPending = r.status === 'OPEN' || r.status === 'IN_REVIEW';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewModal({ isOpen: true, report: r })}
              className="text-xs py-1 px-2 h-auto"
              title="View Report"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setResolveModal({ isOpen: true, report: r, resolutionStatus: 'RESOLVED' })
                  }
                  className="text-xs py-1 px-2.5 h-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setResolveModal({ isOpen: true, report: r, resolutionStatus: 'DISMISSED' })
                  }
                  className="text-xs py-1 px-2 h-auto text-text-muted hover:text-white"
                >
                  Dismiss
                </Button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Flag className="w-7 h-7 text-red-400" />
          Community Reports & Moderation
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review complaints filed against published apps, copyright infringements, inappropriate content, or broken links.
        </p>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={reports}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchReports(page)}
        filterSlot={
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="MALICIOUS">Malicious</option>
              <option value="BROKEN_DOWNLOAD">Broken Download</option>
              <option value="FAKE_APP">Fake App</option>
              <option value="COPYRIGHT">Copyright</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
              <option value="SPAM">Spam</option>
              <option value="SECURITY_CONCERN">Security Concern</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        }
      />

      {/* Resolve / Dismiss Reason Modal */}
      <ActionReasonModal
        isOpen={resolveModal.isOpen}
        onClose={() => setResolveModal({ isOpen: false, report: null, resolutionStatus: 'RESOLVED' })}
        onSubmit={handleResolveSubmit}
        title={resolveModal.resolutionStatus === 'RESOLVED' ? 'Mark Report as Resolved' : 'Dismiss Report'}
        actionType={resolveModal.resolutionStatus === 'RESOLVED' ? 'APPROVE' : 'REJECT'}
        placeholder={
          resolveModal.resolutionStatus === 'RESOLVED'
            ? 'Explain resolution taken (e.g., Requested developer update; verified issue resolved)...'
            : 'Explain reason for dismissing (e.g., False report; app conforms to developer guidelines)...'
        }
      />

      {/* View Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, report: null })}
        title="Report Details & Evidence"
        size="md"
      >
        {viewModal.report && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-surface-tertiary rounded-xl border border-border-primary/60 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Target Type:</span>
                <span className="font-semibold text-white uppercase">{viewModal.report.targetType}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Target ID:</span>
                <span className="font-mono text-white">{viewModal.report.targetId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Category:</span>
                <span className="text-amber-400 font-semibold">{viewModal.report.category}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Reporter:</span>
                <span className="text-white">
                  {viewModal.report.reporter?.fullName || viewModal.report.reporter?.email || 'Anonymous'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Status:</span>
                <AdminBadge status={viewModal.report.status} />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-white">Report Description:</span>
              <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary text-text-secondary whitespace-pre-wrap">
                {viewModal.report.description}
              </div>
            </div>

            {viewModal.report.resolution && (
              <div className="space-y-1.5">
                <span className="font-semibold text-white">Resolution Notes:</span>
                <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary text-text-muted whitespace-pre-wrap">
                  {viewModal.report.resolution}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="ghost" onClick={() => setViewModal({ isOpen: false, report: null })}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReportsPage;
