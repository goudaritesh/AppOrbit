import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { CreditCard, CheckCircle2, Shield, Calendar, Users, Sparkles, RefreshCw, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSubscriptionsPage = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', status: 'ALL', plan: 'ALL' });

  // Update subscription modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    planId: '',
    status: 'ACTIVE',
    customAppLimit: '',
    monthsToAdd: '1',
    resetUsage: false,
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const res = await adminApi.getSubscriptionPlans();
      if (res.success) {
        setPlans(res.data.plans || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async (page = 1) => {
    try {
      setLoadingSubs(true);
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        plan: filters.plan !== 'ALL' ? filters.plan : undefined,
      };
      const res = await adminApi.getDeveloperSubscriptions(params);
      if (res.success) {
        setSubscriptions(res.data.subscriptions || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toast.error('Failed to load developer subscriptions');
    } finally {
      setLoadingSubs(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchSubscriptions(1);
  }, [fetchSubscriptions]);

  const handleOpenUpdate = (sub) => {
    setSelectedSub(sub);
    setSubForm({
      planId: sub.plan?._id || '',
      status: sub.status || 'ACTIVE',
      customAppLimit: sub.customAppLimit || '',
      monthsToAdd: '1',
      resetUsage: false,
      reason: ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!subForm.reason.trim()) {
      toast.error('A justification reason is required for administrative audit logs');
      return;
    }

    try {
      setSubmitting(true);
      const devId = selectedSub.developer?._id || selectedSub.developer;
      const payload = {
        planId: subForm.planId || undefined,
        status: subForm.status,
        customAppLimit: subForm.customAppLimit ? parseInt(subForm.customAppLimit, 10) : undefined,
        monthsToAdd: subForm.monthsToAdd ? parseInt(subForm.monthsToAdd, 10) : 0,
        resetUsage: subForm.resetUsage,
        reason: subForm.reason.trim()
      };

      const res = await adminApi.manualUpdateSubscription(devId, payload);
      if (res.success) {
        toast.success('Developer subscription updated successfully');
        setIsUpdateModalOpen(false);
        fetchSubscriptions(pagination.page);
      }
    } catch (err) {
      console.error('Update subscription error:', err);
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'developer',
      label: 'Developer',
      render: (sub) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary/20 to-purple-500/20 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary text-sm">
            {(sub.developer?.fullName || sub.developer?.name || sub.developer?.email || 'D')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">
              {sub.developer?.fullName || sub.developer?.name || 'Developer'}
            </div>
            <div className="text-xs text-text-muted">{sub.developer?.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (sub) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-sm text-brand-accent px-2.5 py-1 rounded-md bg-brand-accent/10 border border-brand-accent/20">
          <Sparkles className="w-3.5 h-3.5" />
          {sub.plan?.name || 'Free Starter'}
        </span>
      )
    },
    {
      key: 'usage',
      label: 'Apps Quota',
      render: (sub) => {
        const used = sub.currentPeriodAppCount || 0;
        const limit = sub.customAppLimit !== undefined ? sub.customAppLimit : (sub.plan?.appLimit ?? 1);
        const pct = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs font-semibold mb-1 text-text-secondary">
              <span>{used} / {limit === -1 ? '∞' : limit}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-brand-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (sub) => <AdminBadge status={sub.status} />
    },
    {
      key: 'validity',
      label: 'Current Period End',
      render: (sub) => (
        <span className="text-xs text-text-secondary">
          {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'Lifetime / Continuous'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (sub) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenUpdate(sub)}
          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1.5"
        >
          <Edit3 className="w-3 h-3" />
          Manage
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-brand-primary" />
          Subscription & Quota Management
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Configure subscription tier entitlements, app publication quotas, and override developer quotas with audit tracking.
        </p>
      </div>

      {/* Plan Tier Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Active Platform Plans
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchPlans}
            loading={loadingPlans}
            className="text-xs text-text-muted hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Plans
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loadingPlans ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-44 bg-surface-secondary border border-border-primary rounded-xl animate-pulse" />
            ))
          ) : (
            plans.map((p) => (
              <div
                key={p._id || p.slug}
                className={`p-5 rounded-xl border bg-surface-secondary/80 backdrop-blur-sm relative overflow-hidden transition-all duration-200 hover:border-brand-primary/40 ${
                  p.slug === 'gold' ? 'border-amber-500/30 ring-1 ring-amber-500/20' : 'border-border-primary'
                }`}
              >
                {p.slug === 'gold' && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Popular
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  {p.slug}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-white">
                    {p.price === 0 ? 'Free' : `₹${p.price}`}
                  </span>
                  {p.price > 0 && <span className="text-xs text-text-muted">/ month</span>}
                </div>

                <div className="space-y-2 text-xs border-t border-border-primary/60 pt-3">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>{p.appLimit === -1 ? 'Unlimited' : p.appLimit}</strong> apps published</span>
                  </div>
                  {p.features?.slice(0, 2).map((feat, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-text-muted truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            Developer Subscriptions & Quotas
          </h2>
        </div>

        <AdminDataTable
          columns={columns}
          data={subscriptions}
          loading={loadingSubs}
          pagination={pagination}
          onPageChange={(page) => fetchSubscriptions(page)}
          searchPlaceholder="Search by developer name or email..."
          searchValue={filters.search}
          onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val }))}
          filterSlot={
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Update Subscription Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Override Developer Subscription & Quota"
        size="md"
      >
        {selectedSub && (
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            <div className="p-3 bg-surface-tertiary rounded-lg border border-border-primary/60 text-xs">
              <div className="font-semibold text-white">
                {selectedSub.developer?.fullName || selectedSub.developer?.name} ({selectedSub.developer?.email})
              </div>
              <div className="text-text-muted mt-1">
                Current: {selectedSub.plan?.name || 'Free Starter'} • Status: {selectedSub.status} • Apps: {selectedSub.currentPeriodAppCount || 0}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Select Plan Tier</label>
              <select
                value={subForm.planId}
                onChange={(e) => setSubForm((prev) => ({ ...prev, planId: e.target.value }))}
                className="w-full bg-surface-secondary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
              >
                <option value="">Keep current plan</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{p.price}/mo - {p.appLimit === -1 ? 'Unlimited' : `${p.appLimit} apps`})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Status</label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-surface-secondary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Extend By Months</label>
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={subForm.monthsToAdd}
                  onChange={(e) => setSubForm((prev) => ({ ...prev, monthsToAdd: e.target.value }))}
                  className="w-full bg-surface-secondary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Custom App Limit Override (Optional, leave blank for plan limit)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g., 25"
                value={subForm.customAppLimit}
                onChange={(e) => setSubForm((prev) => ({ ...prev, customAppLimit: e.target.value }))}
                className="w-full bg-surface-secondary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="resetUsage"
                checked={subForm.resetUsage}
                onChange={(e) => setSubForm((prev) => ({ ...prev, resetUsage: e.target.checked }))}
                className="rounded border-border-primary text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="resetUsage" className="text-xs text-text-secondary cursor-pointer">
                Reset current period app usage count to 0
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Administrative Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Provide a mandatory justification reason for the immutable audit log..."
                value={subForm.reason}
                onChange={(e) => setSubForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full bg-surface-secondary border border-border-primary text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-primary/60">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Subscription
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminSubscriptionsPage;
