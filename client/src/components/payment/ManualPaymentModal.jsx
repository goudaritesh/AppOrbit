import React, { useState } from 'react';
import { X, QrCode, Upload, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';
import { paymentApi } from '../../api/paymentApi';
import toast from 'react-hot-toast';

export const ManualPaymentModal = ({ plan, isOpen, onClose, onSuccess }) => {
  const [transactionId, setTransactionId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen || !plan) return null;

  const upiId = '7848901211@ptsbi';
  const priceFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: plan.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(plan.price);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    toast.success('UPI ID copied to clipboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      toast.error('Please enter the bank / UPI transaction reference ID.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('planId', plan._id || plan.id);
      formData.append('transactionId', transactionId.trim());
      formData.append('amount', plan.price);
      formData.append('currency', plan.currency || 'INR');
      if (proofFile) {
        formData.append('proofFile', proofFile);
      }

      await paymentApi.submitManualPayment(formData);
      setSubmitted(true);
      toast.success('Manual payment submitted for admin review!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit payment claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-low border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-content-dim hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-content-primary">
                Payment Submitted for Review
              </h3>
              <p className="text-xs text-content-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                Your transaction claim <span className="font-mono text-primary font-bold">#{transactionId}</span> has been logged. Once our compliance team verifies your bank receipt, your <span className="font-semibold text-white">{plan.name}</span> plan will automatically activate.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-white/5 text-xs text-content-dim font-mono text-left max-w-xs mx-auto">
              <div>Plan: {plan.name}</div>
              <div>Amount: {priceFormatted}</div>
              <div>Status: MANUAL_REVIEW</div>
            </div>
            <Button variant="primary" size="md" onClick={onClose} className="mt-2">
              Done & Return
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider mb-1">
                <QrCode className="w-4 h-4" />
                <span>Manual UPI / QR Settlement</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-content-primary">
                Upgrade to {plan.name} Plan
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                Scan the QR code or copy our corporate VPA to complete payment of{' '}
                <span className="text-white font-bold">{priceFormatted}</span>.
              </p>
            </div>

            {/* QR Code + UPI Box */}
            <div className="p-4 rounded-2xl bg-surface border border-white/5 flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code representation */}
              <div className="w-48 h-48 rounded-xl bg-white shrink-0 flex items-center justify-center shadow-inner overflow-hidden relative">
                <img src="/qr.png" alt="Payment QR Code" className="w-full h-full object-cover object-center scale-[1.4]" />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="text-xs text-content-dim font-mono">AppOrbit Official VPA:</div>
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-white/10 text-xs font-mono text-primary font-bold">
                    {upiId}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-content-dim hover:text-white transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[11px] text-content-secondary leading-normal">
                  Pay exact amount <strong className="text-white">{priceFormatted}</strong> and paste your 12-digit UTR/Reference ID below.
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5 font-mono">
                  Bank / UPI Transaction Reference (UTR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423985729104 or UPI/423985729104"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary font-mono placeholder:text-content-dim/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5 font-mono">
                  Payment Proof Screenshot (Optional)
                </label>
                <div className="relative border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-3 text-center cursor-pointer transition-colors bg-surface/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-content-dim">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>
                      {proofFile ? proofFile.name : 'Click or drop screenshot (PNG, JPG)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Manual payments require human review and are verified by admins within 1-2 hours. For instant activation, use Razorpay Checkout.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting || !transactionId.trim()}
                icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              >
                {submitting ? 'Submitting...' : 'Submit Claim for Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualPaymentModal;
