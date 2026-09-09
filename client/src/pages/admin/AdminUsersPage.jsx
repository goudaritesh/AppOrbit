import React, { useState, useEffect } from 'react';
import { Users, Ban, CheckCircle, ShieldAlert } from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminBadge from '../../components/admin/AdminBadge';
import ActionReasonModal from '../../components/admin/ActionReasonModal';

/**
 * Admin Consumer Users Directory (Phase 7 Production Implementation)
 */
export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Ban/Suspend modal
  const [actionTarget, setActionTarget] = useState(null); // { user, nextStatus }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: search.trim() || undefined,
      };
      const res = await adminApi.getUsers(params);
      setUsers(res.data?.data?.users || []);
      setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [filterStatus, search]);

  const handleStatusSubmit = async ({ reason }) => {
    try {
      setActionLoading(true);
      await adminApi.updateUserStatus(actionTarget.user._id, {
        status: actionTarget.nextStatus,
        reason,
      });
      await fetchUsers(pagination.page);
      setActionTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Consumer User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-content-primary shrink-0">
            {row.name?.[0] || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-content-primary truncate">{row.name}</span>
            <span className="text-[11px] font-mono text-content-muted truncate">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Account Status',
      render: (row) => <AdminBadge status={row.accountStatus} />,
    },
    {
      header: 'Email Verified',
      render: (row) => (
        <span className="font-mono text-xs text-content-muted">
          {row.emailVerified ? (
            <span className="text-emerald-400">Verified</span>
          ) : (
            <span className="text-amber-400">Pending</span>
          )}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      render: (row) => (
        <span className="font-mono text-xs text-content-muted">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.accountStatus === 'ACTIVE' ? (
            <>
              <button
                onClick={() => setActionTarget({ user: row, nextStatus: 'SUSPENDED' })}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold"
              >
                Suspend
              </button>
              <button
                onClick={() => setActionTarget({ user: row, nextStatus: 'BANNED' })}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold"
              >
                Ban
              </button>
            </>
          ) : (
            <button
              onClick={() => setActionTarget({ user: row, nextStatus: 'ACTIVE' })}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
            >
              Restore
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-content-primary">
            User Management
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Consumer directory, active sessions, status moderation, and safety controls.
          </p>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchUsers}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by user name or email..."
        emptyMessage="No users found."
      />

      <ActionReasonModal
        isOpen={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onSubmit={handleStatusSubmit}
        title={`Set User Status: ${actionTarget?.nextStatus}`}
        description={`Changing account status for ${actionTarget?.user?.name}. Provide justification for the audit trail.`}
        confirmText={`Confirm ${actionTarget?.nextStatus}`}
        confirmVariant={actionTarget?.nextStatus === 'BANNED' ? 'danger' : 'primary'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminUsersPage;
