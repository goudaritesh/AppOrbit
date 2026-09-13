import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  Boxes,
  ShieldAlert,
  CreditCard,
  MessageSquare,
  Plus,
  Eye,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import SecurityStatusBadge from '../../components/security/SecurityStatusBadge';

/**
 * Admin Developer Account Dossier (Phase 7 Production Implementation)
 */
export const AdminDeveloperDetailPage = () => {
  const { developerId } = useParams();
  const [developer, setDeveloper] = useState(null);
  const [apps, setApps] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [securityReports, setSecurityReports] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Note
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Subscription Modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('silver');
  const [subReason, setSubReason] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const fetchDeveloperData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDeveloperById(developerId);
      const data = res.data;
      setDeveloper(data.developer);
      setApps(data.apps || []);
      setSubscription(data.subscription);
      setPayments(data.payments || []);
      setSecurityReports(data.securityReports || []);
      setAdminNotes(data.adminNotes || []);
    } catch (err) {
      console.error('Failed to load developer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeveloperData();
  }, [developerId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setNoteLoading(true);
      await adminApi.addDeveloperNote(developerId, { note: newNote.trim() });
      setNewNote('');
      await fetchDeveloperData();
    } catch (err) {
      alert('Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  const openSubModal = async () => {
    try {
      const res = await adminApi.getSubscriptionPlans();
      setPlans(res.data?.plans || []);
      setSubModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    if (!subReason.trim()) {
      alert('Reason is required');
      return;
    }

    try {
      setSubLoading(true);
      await adminApi.manualUpdateSubscription(developerId, {
        planSlug: selectedPlanSlug,
        reason: subReason.trim(),
      });
      setSubModalOpen(false);
      setSubReason('');
      await fetchDeveloperData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-content-muted font-mono animate-pulse">
        Loading developer dossier...
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="p-12 text-center">
        <p className="text-content-muted mb-4">Developer account not found.</p>
        <Link to="/admin/developers" className="text-primary hover:underline text-sm font-semibold">
          ← Return to Developers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <Link
          to="/admin/developers"
          className="p-2 rounded-xl border border-white/10 text-content-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-lg text-content-primary">
            {developer.name?.[0] || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-heading font-extrabold text-content-primary">
                {developer.name}
              </h1>
              <AdminBadge status={developer.accountStatus} />
            </div>
            <p className="text-xs font-mono text-content-muted">
              {developer.email} • Joined {new Date(developer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applications list */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary flex items-center gap-2">
              <Boxes className="w-4 h-4 text-primary" />
              <span>Owned Applications ({apps.length})</span>
            </h3>

            {apps.length === 0 ? (
              <p className="text-xs text-content-muted font-mono">No applications created yet.</p>
            ) : (
              <div className="space-y-2">
                {apps.map((app) => (
                  <div
                    key={app._id}
                    className="p-3.5 rounded-xl bg-surface border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={app.icon || '/placeholder-app.png'}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover bg-surface-elevated"
                      />
                      <div>
                        <span className="font-bold text-xs text-content-primary block">
                          {app.name}
                        </span>
                        <span className="text-[11px] font-mono text-content-muted">
                          {app.packageName || app.slug}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AdminBadge status={app.status} />
                      <Link
                        to={`/admin/apps/${app._id}`}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-content-muted hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Reports */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Security Incidents & Scans ({securityReports.length})</span>
            </h3>

            {securityReports.length === 0 ? (
              <p className="text-xs text-content-muted font-mono">No security incidents on record.</p>
            ) : (
              <div className="space-y-2">
                {securityReports.map((report) => (
                  <div
                    key={report._id}
                    className="p-3 rounded-xl bg-surface border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <SecurityStatusBadge status={report.status} size="sm" />
                      <span className="font-mono text-content-muted">
                        Risk: {report.riskScore}/100 ({report.riskLevel})
                      </span>
                    </div>
                    <span className="text-content-muted font-mono">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent-cyan" />
              <span>Private Administrator Notes</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add confidential internal note about this developer..."
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-xs focus:outline-none focus:border-primary resize-none"
              />
              <button
                type="submit"
                disabled={noteLoading || !newNote.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-semibold transition-colors"
              >
                {noteLoading ? 'Saving...' : 'Add Note'}
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {adminNotes.map((note, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface border border-white/5 text-xs">
                  <p className="text-content-primary">{note.note}</p>
                  <span className="text-[10px] font-mono text-content-muted mt-1 block">
                    {note.author?.name || 'Admin'} • {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Subscription & Payments */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-content-primary flex items-center gap-2">
                <Crown className="w-4 h-4 text-accent-cyan" />
                <span>Subscription Plan</span>
              </h3>
              <button
                onClick={openSubModal}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Current Tier</span>
                <span className="font-bold text-accent-cyan font-mono">
                  {subscription?.plan?.name || subscription?.planSlug || 'Free Starter'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Plan Status</span>
                <AdminBadge status={subscription?.status || 'ACTIVE'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Apps Quota</span>
                <span className="font-bold text-content-primary font-mono">
                  {apps.length} / {subscription?.appsLimit || 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-mono">Renewal / Expiry</span>
                <span className="text-content-primary font-mono">
                  {subscription?.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : 'Lifetime'}
                </span>
              </div>
            </div>
          </div>

          {/* Payments History */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-content-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment History ({payments.length})</span>
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-content-muted font-mono">No payment transactions on record.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {payments.map((pay) => (
                  <div
                    key={pay._id}
                    className="p-3 rounded-xl bg-surface border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-content-primary block">
                        ₹{pay.amount} ({pay.method})
                      </span>
                      <span className="text-[10px] text-content-muted">{pay.paymentId}</span>
                    </div>
                    <AdminBadge status={pay.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Plan Modal */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-content-primary">
              Manual Subscription Assignment
            </h3>
            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-content-muted mb-1.5">Select Plan</label>
                <select
                  value={selectedPlanSlug}
                  onChange={(e) => setSelectedPlanSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-xs focus:outline-none focus:border-primary"
                >
                  {plans.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} (Quota: {p.appLimit} apps - ₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-content-muted mb-1.5">
                  Administrative Justification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  placeholder="Reason for manual subscription change..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-content-muted text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subLoading}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {subLoading ? 'Updating...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeveloperDetailPage;
