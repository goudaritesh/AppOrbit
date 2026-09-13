import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { History, Shield, Eye, Lock, FileText, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    action: 'ALL',
    resourceType: 'ALL'
  });

  // Modal to inspect full metadata & JSON states
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        action: filters.action !== 'ALL' ? filters.action : undefined,
        resourceType: filters.resourceType !== 'ALL' ? filters.resourceType : undefined
      };
      const res = await adminApi.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load platform audit trail');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const columns = [
    {
      key: 'action',
      label: 'Admin Action',
      render: (log) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded">
            {log.action}
          </span>
        </div>
      )
    },
    {
      key: 'actor',
      label: 'Performed By',
      render: (log) => (
        <div className="text-xs">
          <div className="font-medium text-white flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            {log.actor?.fullName || log.actor?.name || 'Administrator'}
          </div>
          <div className="text-text-muted text-[11px]">
            {log.actor?.email} • <span className="text-brand-accent">{log.actorRole}</span>
          </div>
        </div>
      )
    },
    {
      key: 'resource',
      label: 'Target Resource',
      render: (log) => (
        <div className="text-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted bg-surface-tertiary px-1.5 py-0.5 rounded border border-border-primary">
            {log.resourceType}
          </span>
          <div className="font-mono text-text-secondary truncate max-w-[130px] mt-0.5">
            {log.resourceId}
          </div>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Justification / Reason',
      render: (log) => (
        <div className="text-xs text-text-secondary max-w-xs truncate" title={log.reason || log.metadata?.reason}>
          {log.reason || log.metadata?.reason || <span className="text-text-muted italic">System triggered</span>}
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: 'Origin IP',
      render: (log) => (
        <span className="font-mono text-xs text-text-muted">
          {log.ipAddress || '127.0.0.1'}
        </span>
      )
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log) => (
        <span className="text-xs text-text-secondary whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Inspect',
      align: 'right',
      render: (log) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedLog(log)}
          className="text-xs py-1 px-2 h-auto"
          title="Inspect Audit Metadata"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <History className="w-7 h-7 text-brand-primary" />
          Forensic Audit Ledger
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Cryptographically referenced, immutable administrative history for platform moderation, suspensions, financial approvals, and configuration changes.
        </p>
      </div>

      {/* Security notice badge */}
      <div className="flex items-center gap-3 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-xs text-brand-accent">
        <Lock className="w-4 h-4 text-brand-primary shrink-0" />
        <span>
          <strong>Append-Only Integrity:</strong> Audit log entries are permanently stored and cannot be edited, rolled back, or deleted through any administrative endpoint.
        </span>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchLogs(page)}
        filterSlot={
          <div className="flex gap-2">
            <select
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Actions</option>
              <option value="APP_APPROVED">APP_APPROVED</option>
              <option value="APP_REJECTED">APP_REJECTED</option>
              <option value="APP_BLOCKED">APP_BLOCKED</option>
              <option value="DEVELOPER_SUSPENDED">DEVELOPER_SUSPENDED</option>
              <option value="DEVELOPER_RESTORED">DEVELOPER_RESTORED</option>
              <option value="SECURITY_REVIEW_DECISION">SECURITY_REVIEW_DECISION</option>
              <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
              <option value="SUBSCRIPTION_UPDATED">SUBSCRIPTION_UPDATED</option>
              <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
            </select>

            <select
              value={filters.resourceType}
              onChange={(e) => setFilters((prev) => ({ ...prev, resourceType: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Resources</option>
              <option value="APPLICATION">APPLICATION</option>
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="USER">USER</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              <option value="SECURITY_REPORT">SECURITY_REPORT</option>
              <option value="SUPPORT_TICKET">SUPPORT_TICKET</option>
              <option value="SETTINGS">SETTINGS</option>
            </select>
          </div>
        }
      />

      {/* Metadata Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Forensic Inspector"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-surface-tertiary rounded-xl border border-border-primary/60">
              <div>
                <span className="text-text-muted block">Action:</span>
                <span className="font-mono font-bold text-brand-primary">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-text-muted block">Actor:</span>
                <span className="font-semibold text-white">
                  {selectedLog.actor?.fullName || selectedLog.actor?.email} ({selectedLog.actorRole})
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Target:</span>
                <span className="font-mono text-white">
                  {selectedLog.resourceType} : {selectedLog.resourceId}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Timestamp:</span>
                <span className="text-text-secondary">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            {selectedLog.reason && (
              <div>
                <span className="font-semibold text-white block mb-1">Administrative Justification:</span>
                <div className="p-3 rounded-lg bg-surface-secondary border border-border-primary text-text-secondary">
                  {selectedLog.reason}
                </div>
              </div>
            )}

            {/* Previous vs New State Diff if available */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-text-muted block mb-1">Previous State</span>
                <pre className="p-3 bg-black/60 rounded-lg border border-border-primary font-mono text-[11px] text-text-secondary overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.previousState || {}, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-semibold text-emerald-400 block mb-1">New State</span>
                <pre className="p-3 bg-black/60 rounded-lg border border-border-primary font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.newState || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Additional Metadata */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <span className="font-semibold text-white block mb-1">Attached Metadata</span>
                <pre className="p-3 bg-black/60 rounded-lg border border-border-primary font-mono text-[11px] text-text-muted overflow-x-auto max-h-36">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogsPage;
