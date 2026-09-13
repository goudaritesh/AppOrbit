import React, { useRef } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import Button from '../ui/Button';

export const ReceiptModal = ({ payment, isOpen, onClose }) => {
  const printRef = useRef(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNumber =
    payment.receiptNumber ||
    payment.receipt?.receiptNumber ||
    `AB-${new Date(payment.createdAt).getFullYear()}-${String(payment._id).slice(-6).toUpperCase()}`;

  const priceFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: payment.currency || 'INR',
    maximumFractionDigits: 2,
  }).format(payment.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-xl rounded-3xl bg-surface-low border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-content-dim font-bold">
              Formal Payment Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-content-dim hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto py-6 space-y-6 text-content-primary"
          id="printable-receipt"
        >
          {/* Brand Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 p-1.5 flex items-center justify-center">
                <img src="/logo.png" alt="AppOrbit" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-lg tracking-tight">
                  App<span className="text-primary">Orbit</span> Technologies
                </h2>
                <p className="text-[11px] text-content-dim font-mono">
                  Android Developer Ecosystem & Cloud Services
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-content-dim">Receipt Number</div>
              <div className="text-sm font-bold font-mono text-primary">{receiptNumber}</div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Payment Verified & Cleared</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              STATUS: {payment.status}
            </span>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-surface border border-white/5 text-xs">
            <div>
              <div className="text-content-dim font-mono text-[10px] uppercase">Issued Date</div>
              <div className="font-semibold text-content-primary mt-0.5">
                {new Date(payment.createdAt || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-content-dim font-mono text-[10px] uppercase">Payment Method</div>
              <div className="font-semibold text-content-primary mt-0.5 font-mono">
                {payment.provider || payment.paymentMethod || 'RAZORPAY'}
              </div>
            </div>
            <div>
              <div className="text-content-dim font-mono text-[10px] uppercase">Provider Ref</div>
              <div className="font-semibold text-content-primary mt-0.5 font-mono text-[11px] truncate" title={payment.providerPaymentId || payment.paymentId}>
                {payment.providerPaymentId || payment.paymentId || 'N/A'}
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 text-content-dim font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-3.5">Plan / Description</th>
                  <th className="p-3.5 text-center">Period</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-3.5">
                    <div className="font-semibold text-content-primary">
                      AppOrbit {payment.plan?.name || payment.planSlug || 'Subscription'} Tier
                    </div>
                    <div className="text-[11px] text-content-dim mt-0.5">
                      Developer Application Hosting & Signed Release Quota
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-mono text-content-secondary">
                    {payment.plan?.billingPeriod || 'MONTHLY'}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-content-primary">
                    {priceFormatted}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-surface/40 font-semibold border-t border-white/10">
                <tr>
                  <td colSpan="2" className="p-3.5 text-right font-mono text-content-dim">
                    Total Paid:
                  </td>
                  <td className="p-3.5 text-right font-mono text-base font-bold text-primary">
                    {priceFormatted}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Trust Seal */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-content-dim">
            <div className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Digitally verified by AppOrbit Payment Ledger Engine</span>
            </div>
            <div className="font-mono">
              Ref: {String(payment._id).slice(-8).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
