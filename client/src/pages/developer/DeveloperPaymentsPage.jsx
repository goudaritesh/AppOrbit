import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, Search, Filter, Loader2, CheckCircle2, Clock, AlertCircle, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api/paymentApi';
import ReceiptModal from '../../components/payment/ReceiptModal';
import Button from '../../components/ui/Button';

export const DeveloperPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getPaymentHistory({
        status: statusFilter,
        page,
        limit: 10,
      });

      if (res?.data) {
        setPayments(res.data.payments || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      toast.error('Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (payment) => {
    setSelectedReceiptPayment(payment);
    setReceiptModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>CLEARED</span>
          </span>
        );
      case 'MANUAL_REVIEW':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
            <Clock className="w-3 h-3" />
            <span>REVIEWING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-content-dim text-[10px] font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Financial Transactions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-content-primary">
            Billing & Payment Ledger
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface border border-white/5 overflow-x-auto">
          {['ALL', 'SUCCESS', 'MANUAL_REVIEW', 'FAILED'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all ${
                statusFilter === tab
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-content-dim hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl bg-surface-low border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-content-dim font-mono uppercase text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">Payment Reference</th>
                <th className="p-4">Subscription Plan</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-content-dim font-mono">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-content-dim">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>No transaction records found matching filter.</span>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-medium text-content-primary">
                      <div className="truncate max-w-[140px]" title={payment.providerPaymentId || payment.paymentId}>
                        {payment.providerPaymentId || payment.paymentId || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-content-primary">
                      {payment.plan?.name || payment.planSlug || 'Workspace Tier'}
                    </td>
                    <td className="p-4 font-mono font-bold text-content-primary">
                      ₹{payment.amount}
                    </td>
                    <td className="p-4 font-mono text-content-dim">
                      {payment.provider || payment.paymentMethod || 'RAZORPAY'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="p-4 font-mono text-content-dim">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleOpenReceipt(payment)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface border border-white/10 hover:border-primary/50 text-content-primary hover:text-primary font-mono text-[11px] transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-content-dim/40 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-content-dim">
            <span>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal
        payment={selectedReceiptPayment}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  );
};

export default DeveloperPaymentsPage;
