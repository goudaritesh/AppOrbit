import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Eye, ShieldAlert, CheckCircle, Ban } from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminBadge from '../../components/admin/AdminBadge';
import ActionReasonModal from '../../components/admin/ActionReasonModal';

/**
 * Admin Developer Management Directory (Phase 7 Production Implementation)
 */
export const AdminDevelopersPage = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Suspend/Restore modal
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDevelopers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: search.trim() || undefined,
      };
      const res = await adminApi.getDevelopers(params);
      setDevelopers(res.data?.data?.developers || []);
      setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load developers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers(1);
  }, [filterStatus, search]);

  const handleSuspendSubmit = async (params) => {
    try {
      setActionLoading(true);
      await adminApi.suspendDeveloper(suspendTarget._id, params);
      await fetchDevelopers(pagination.page);
      setSuspendTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Suspension failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (dev) => {
    if (!window.confirm(`Restore developer "${dev.name}" to ACTIVE status?`)) return;
    try {
      setLoading(true);
      await adminApi.restoreDeveloper(dev._id);
      await fetchDevelopers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Developer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-content-primary shrink-0">
            {row.name?.[0] || 'D'}
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
      header: 'Subscription Plan',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-mono">
          {row.subscription?.planName || 'Free'}
        </span>
      ),
    },
    {
      header: 'Apps Allotment',
      render: (row) => (
        <span className="font-mono text-xs text-content-primary">
          {row.stats?.totalApps || 0} / {row.subscription?.appsLimit || 1}
        </span>
      ),
    },
    {
      header: 'Published',
      render: (row) => (
        <span className="font-mono text-xs text-emerald-400">
          {row.stats?.publishedApps || 0}
        </span>
      ),
    },
    {
      header: 'Total Downloads',
      render: (row) => (
        <span className="font-mono text-xs text-content-primary">
          {(row.stats?.totalDownloads || 0).toLocaleString()}
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
          <Link
            to={`/admin/developers/${row._id}`}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-content-muted hover:text-white"
            title="Inspect Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          {row.accountStatus === 'SUSPENDED' ? (
            <button
              onClick={() => handleRestore(row)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() => setSuspendTarget(row)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold"
            >
              Suspend
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterSlot = (
    <div className="flex items-center gap-1.5">
      {['ALL', 'ACTIVE', 'SUSPENDED', 'RESTRICTED', 'BANNED'].map((s) => (
        <button
          key={s}
          onClick={() => setFilterStatus(s)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
            filterStatus === s
              ? 'bg-primary text-white font-semibold'
              : 'bg-surface-elevated text-content-muted hover:text-white border border-white/10'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-content-primary">
            Developer Accounts
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Publishing quotas, subscription plans, status enforcement, and suspensions.
          </p>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={developers}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchDevelopers}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by developer name or email..."
        filterSlot={filterSlot}
        emptyMessage="No developers found for the selected filter."
      />

      <ActionReasonModal
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onSubmit={handleSuspendSubmit}
        title={`Suspend Developer: ${suspendTarget?.name}`}
        description="Specify suspension duration and mandatory violation justification."
        confirmText="Confirm Suspension"
        confirmVariant="danger"
        showSuspensionTypes={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminDevelopersPage;
