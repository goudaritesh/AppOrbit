import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, ShieldCheck, AlertOctagon, Filter } from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminBadge from '../../components/admin/AdminBadge';
import SecurityStatusBadge from '../../components/security/SecurityStatusBadge';

/**
 * Admin Applications Directory & Moderation Table (Phase 7 Production Implementation)
 */
export const AdminAppsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const currentStatus = searchParams.get('status') || 'ALL';
  const [search, setSearch] = useState('');

  const fetchApps = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: currentStatus !== 'ALL' ? currentStatus : undefined,
        search: search.trim() || undefined,
      };

      const res = await adminApi.getApps(params);
      setApps(res.data?.data?.apps || []);
      setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps(1);
  }, [currentStatus, search]);

  const handleStatusFilterChange = (status) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'ALL') {
      next.delete('status');
    } else {
      next.set('status', status);
    }
    setSearchParams(next);
  };

  const columns = [
    {
      header: 'Application',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.icon || '/placeholder-app.png'}
            alt={row.name}
            className="w-9 h-9 rounded-xl object-cover bg-surface border border-white/10 shrink-0"
            onError={(e) => {
              e.target.src = '/placeholder-app.png';
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-content-primary truncate">{row.name}</span>
            <span className="text-[11px] font-mono text-content-muted truncate">
              {row.packageName || row.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Developer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-content-primary font-medium">{row.developer?.name || 'Unknown'}</span>
          <span className="text-[11px] font-mono text-content-muted">{row.developer?.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-content-muted">
          {row.category?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: 'Version',
      render: (row) => (
        <span className="font-mono text-xs text-content-primary">
          {row.currentVersion ? `v${row.currentVersion.versionName} (#${row.currentVersion.versionCode})` : 'None'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminBadge status={row.status} />,
    },
    {
      header: 'Security',
      render: (row) => (
        <SecurityStatusBadge
          status={row.currentVersion?.securityStatus || 'NOT_SCANNED'}
          size="sm"
        />
      ),
    },
    {
      header: 'Downloads',
      render: (row) => (
        <span className="font-mono text-xs text-content-primary">
          {(row.downloadCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <Link
          to={`/admin/apps/${row._id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-content-primary text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Review</span>
        </Link>
      ),
    },
  ];

  const filterSlot = (
    <div className="flex items-center gap-1.5">
      {[
        { label: 'All', value: 'ALL' },
        { label: 'Pending Review', value: 'PENDING_REVIEW' },
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Blocked', value: 'BLOCKED' },
      ].map((f) => (
        <button
          key={f.value}
          onClick={() => handleStatusFilterChange(f.value)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
            currentStatus === f.value
              ? 'bg-primary text-white'
              : 'bg-surface-elevated text-content-muted hover:text-white border border-white/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-content-primary">
            Application Moderation
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Review submissions, inspect release candidates, and control platform publishing.
          </p>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={apps}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchApps}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by application, developer or package name..."
        filterSlot={filterSlot}
        emptyMessage="No applications found matching the selected filter."
      />
    </div>
  );
};

export default AdminAppsPage;
