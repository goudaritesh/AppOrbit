import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Eye, RefreshCw } from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminDataTable from '../../components/admin/AdminDataTable';
import SecurityStatusBadge from '../../components/security/SecurityStatusBadge';
import RiskScoreGauge from '../../components/security/RiskScoreGauge';

/**
 * Admin Security Review Center (Phase 7 Production Implementation)
 * Operational queue of automated static APK analysis reports, manual review escalations, and quarantine actions.
 */
export const AdminSecurityPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterRisk, setFilterRisk] = useState('ALL');

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        riskLevel: filterRisk !== 'ALL' ? filterRisk : undefined,
      };
      const res = await adminApi.getSecurityReports(params);
      setReports(res.data?.reports || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load security reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [filterRisk]);

  const columns = [
    {
      header: 'Application & Release',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.app?.icon || '/placeholder-app.png'}
            alt=""
            className="w-8 h-8 rounded-lg object-cover bg-surface border border-white/10 shrink-0"
            onError={(e) => {
              e.target.src = '/placeholder-app.png';
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-content-primary truncate">{row.app?.name || 'App'}</span>
            <span className="text-[11px] font-mono text-content-muted">
              v{row.version?.versionName} (#{row.version?.versionCode})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Developer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-content-primary font-medium">{row.developer?.name || 'Developer'}</span>
          <span className="text-[11px] font-mono text-content-muted">{row.developer?.email}</span>
        </div>
      ),
    },
    {
      header: 'Security Status',
      render: (row) => <SecurityStatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Risk Level',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-content-primary">
            {row.riskScore}/100
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              row.riskLevel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400'
                : row.riskLevel === 'HIGH'
                ? 'bg-amber-500/20 text-amber-400'
                : row.riskLevel === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {row.riskLevel}
          </span>
        </div>
      ),
    },
    {
      header: 'Review Trigger',
      render: (row) => (
        <span className="text-xs text-content-muted">
          {row.manualReviewRequired ? (
            <span className="text-amber-400 font-mono font-semibold">Review Required</span>
          ) : (
            <span className="text-emerald-400 font-mono">Automated Pass</span>
          )}
        </span>
      ),
    },
    {
      header: 'Evaluated At',
      render: (row) => (
        <span className="text-xs text-content-muted font-mono">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <Link
          to={`/admin/security/${row._id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-content-primary text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </Link>
      ),
    },
  ];

  const filterSlot = (
    <div className="flex items-center gap-1.5">
      {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
        <button
          key={lvl}
          onClick={() => setFilterRisk(lvl)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
            filterRisk === lvl
              ? 'bg-primary text-white font-semibold'
              : 'bg-surface-elevated text-content-muted hover:text-white border border-white/10'
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-content-primary">
            Security Review Center
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Static APK inspection reports, threat flags, risk scoring, and manual moderation verdicts.
          </p>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={reports}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchReports}
        filterSlot={filterSlot}
        emptyMessage="No security reports found for the selected risk filter."
      />
    </div>
  );
};

export default AdminSecurityPage;
