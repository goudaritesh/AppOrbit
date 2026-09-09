import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDataTable from '../../components/admin/AdminDataTable';
import ActionReasonModal from '../../components/admin/ActionReasonModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { DollarSign, CheckCircle, XCircle, Eye, QrCode, CreditCard, Sparkles, ExternalLink, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    paymentMethod: 'ALL'
  });

  // Verify modal state
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    payment: null,
    decision: 'APPROVED', // 'APPROVED' or 'REJECTED'
  });

  // Details modal state
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    payment: null
  });

  const fetchPayments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        paymentMethod: filters.paymentMethod !== 'ALL' ? filters.paymentMethod : undefined
      };
      const res = await adminApi.getPayments(params);
      if (res.data?.success) {
        setPayments(res.data.data.payments || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      toast.error('Failed to load payments list');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleVerifySubmit = async ({ reason }) => {
    const payment = verifyModal.payment;
    if (!payment) return;

    try {
      const res = await adminApi.verifyPayment(payment._id, {
        decision: verifyModal.decision,
        reason: reason.trim()
      });
      if (res.data?.success) {
        toast.success(`Payment successfully marked as ${verifyModal.decision}`);
        setVerifyModal({ isOpen: false, payment: null, decision: 'APPROVED' });
        fetchPayments(pagination.page);
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    }
  };

  const columns = [
    {
      key: 'developer',
      label: 'Developer',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-bold text-brand-primary text-xs">
            {(p.developer?.fullName || p.developer?.name || p.developer?.email || 'D')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">
              {p.developer?.fullName || p.developer?.name || 'Developer'}
            </div>
            <div className="text-xs text-text-muted">{p.developer?.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'plan',
      label: 'Target Plan',
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
          <Sparkles className="w-3 h-3" />
          {p.plan?.name || 'Pro Tier'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (p) => (
        <span className="font-bold text-white text-sm">
          {p.currency === 'INR' ? '₹' : p.currency + ' '}
          {p.amount?.toLocaleString()}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
          {p.paymentMethod === 'MANUAL_QR' ? (
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
          )}
          {p.paymentMethod || 'MANUAL_QR'}
        </span>
      )
    },
    {
      key: 'ref',
      label: 'Transaction Ref / UTR',
      render: (p) => (
        <span className="font-mono text-xs text-text-muted truncate max-w-[120px] block" title={p.transactionId || p.paymentReference}>
          {p.transactionId || p.paymentReference || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <AdminBadge status={p.status} />
    },
    {
      key: 'date',
      label: 'Date',
      render: (p) => (
        <span className="text-xs text-text-secondary">
          {new Date(p.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (p) => {
        const isPending = p.status === 'PENDING' || p.status === 'MANUAL_REVIEW';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDetailsModal({ isOpen: true, payment: p })}
              className="text-xs py-1 px-2 h-auto"
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setVerifyModal({ isOpen: true, payment: p, decision: 'APPROVED' })}
                  className="text-xs py-1 px-2 h-auto bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVerifyModal({ isOpen: true, payment: p, decision: 'REJECTED' })}
                  className="text-xs py-1 px-2 h-auto text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
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
          <DollarSign className="w-7 h-7 text-emerald-400" />
          Payment & Revenue Management
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review manual QR/UPI transfers, verify transaction hashes, and activate developer subscription quotas.
        </p>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchPayments(page)}
        searchPlaceholder="Search by developer, email, or transaction ID..."
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
              <option value="PENDING">Pending</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Methods</option>
              <option value="MANUAL_QR">Manual QR</option>
              <option value="UPI">UPI</option>
              <option value="RAZORPAY">Razorpay</option>
            </select>
          </div>
        }
      />

      {/* Verification Reason Modal */}
      <ActionReasonModal
        isOpen={verifyModal.isOpen}
        onClose={() => setVerifyModal({ isOpen: false, payment: null, decision: 'APPROVED' })}
        onSubmit={handleVerifySubmit}
        title={verifyModal.decision === 'APPROVED' ? 'Approve Payment & Activate Subscription' : 'Reject Payment'}
        actionType={verifyModal.decision === 'APPROVED' ? 'APPROVE' : 'REJECT'}
        placeholder={
          verifyModal.decision === 'APPROVED'
            ? 'e.g., Bank statement verified matching UTR with transaction amount.'
            : 'e.g., Transaction ID not found on bank reconciliation statement.'
        }
        warningText={
          verifyModal.decision === 'APPROVED'
            ? 'Approving this payment will mark the payment SUCCESS and activate the developer subscription entitlements immediately.'
            : 'Rejecting this payment will notify the developer to submit valid payment evidence.'
        }
      />

      {/* Payment Details Modal */}
      <Modal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, payment: null })}
        title="Payment & Evidence Details"
        size="md"
      >
        {detailsModal.payment && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-surface-tertiary rounded-xl border border-border-primary/60 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Payment ID:</span>
                <span className="font-mono text-white font-semibold">{detailsModal.payment._id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Developer:</span>
                <span className="text-white font-semibold">
                  {detailsModal.payment.developer?.fullName || detailsModal.payment.developer?.email}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Plan:</span>
                <span className="text-brand-accent font-semibold">{detailsModal.payment.plan?.name || 'Pro'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Amount:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {detailsModal.payment.currency === 'INR' ? '₹' : detailsModal.payment.currency}{' '}
                  {detailsModal.payment.amount}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Payment Method:</span>
                <span className="text-white font-medium">{detailsModal.payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-primary/60">
                <span className="text-text-muted">Transaction ID / UTR:</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {detailsModal.payment.transactionId || detailsModal.payment.paymentReference || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Status:</span>
                <AdminBadge status={detailsModal.payment.status} />
              </div>
            </div>

            {/* Receipt / Proof Image if available */}
            {detailsModal.payment.receiptUrl && (
              <div className="space-y-1.5">
                <span className="font-semibold text-white">Submitted Payment Proof:</span>
                <div className="rounded-lg overflow-hidden border border-border-primary bg-black max-h-64 flex items-center justify-center">
                  <img
                    src={detailsModal.payment.receiptUrl}
                    alt="Payment Proof"
                    className="object-contain max-h-64 w-full"
                  />
                </div>
              </div>
            )}

            {/* Audit Notes */}
            {detailsModal.payment.verificationNotes && (
              <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary text-text-secondary">
                <div className="font-semibold text-white mb-1">Verification Note:</div>
                <p>{detailsModal.payment.verificationNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="ghost" onClick={() => setDetailsModal({ isOpen: false, payment: null })}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPaymentsPage;
