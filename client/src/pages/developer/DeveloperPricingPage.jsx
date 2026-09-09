import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Shield, CreditCard, QrCode, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscriptionApi';
import { paymentApi } from '../../api/paymentApi';
import { setPlans, setCurrentSubscription, setUsage } from '../../store/slices/subscriptionSlice';
import PricingCard from '../../components/subscription/PricingCard';
import ManualPaymentModal from '../../components/payment/ManualPaymentModal';

/**
 * Dynamically injects Razorpay Checkout SDK into page
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const DeveloperPricingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { plans, currentSubscription, usage } = useSelector((state) => state.subscription);
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, usageRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getUsage(),
      ]);

      if (plansRes?.data?.plans) {
        dispatch(setPlans(plansRes.data.plans));
      }
      if (subRes?.data?.subscription) {
        dispatch(setCurrentSubscription(subRes.data.subscription));
      }
      if (usageRes?.data?.usage) {
        dispatch(setUsage(usageRes.data.usage));
      }
    } catch (err) {
      toast.error('Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanForPayment(plan);
    setPaymentMethodModal(true);
  };

  /**
   * Execute Razorpay payment checkout
   */
  const handleRazorpayCheckout = async () => {
    setPaymentMethodModal(false);
    const plan = selectedPlanForPayment;

    try {
      // 1. Create order on server (server calculates exact price from plan)
      toast.loading('Initializing secure order...', { id: 'rzp-order' });
      const orderRes = await paymentApi.createOrder(plan._id || plan.id);
      toast.dismiss('rzp-order');

      const { orderId, amount, currency, keyId, paymentReference } = orderRes.data;

      // 2. Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay payment SDK. Please try again.');
        return;
      }

      // 3. Open Razorpay options
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'AppOrbit Platform',
        description: `Subscription to ${plan.name} Tier`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#6366F1',
        },
        handler: async (response) => {
          // 4. Client NEVER asserts success - must be verified cryptographically on server
          setVerifyingPayment(true);
          try {
            const verifyRes = await paymentApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              paymentReference,
            });

            if (verifyRes.success) {
              toast.success(`Welcome to ${plan.name}! Subscription activated.`);
              await fetchPricingData();
              navigate('/developer/subscription');
            } else {
              toast.error(verifyRes.message || 'Payment verification failed.');
            }
          } catch (verifyErr) {
            toast.error(verifyErr?.message || 'Verification failed. Please contact support.');
          } finally {
            setVerifyingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failRes) => {
        toast.error(`Payment failed: ${failRes?.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      toast.dismiss('rzp-order');
      toast.error(err?.message || 'Failed to initialize payment.');
    }
  };

  const handleManualCheckout = () => {
    setPaymentMethodModal(false);
    setManualModalOpen(true);
  };

  const currentPlanSlug = usage?.planSlug || currentSubscription?.planSlug || 'free';

  return (
    <div className="space-y-10 pb-16 animate-in fade-in-50">
      {/* Verifying Payment Fullscreen Overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Verifying Payment Cryptography...
          </h2>
          <p className="text-xs text-content-dim mt-1 max-w-sm font-mono">
            Validating HMAC SHA-256 signature and provisioning application quota...
          </p>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold">
          <Crown className="w-3.5 h-3.5" />
          <span>Flexible Developer Tiers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-content-primary tracking-tight">
          Supercharge Your Android App Distribution
        </h1>
        <p className="text-sm text-content-secondary leading-relaxed">
          Scale from hobby builds to enterprise releases. Guaranteed malware scanning, priority reviews, and signed deployment pipelines.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-content-dim font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          Loading tier specifications...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent =
              plan.slug === currentPlanSlug &&
              (currentSubscription?.status === 'ACTIVE' || plan.slug === 'free');

            return (
              <PricingCard
                key={plan._id || plan.slug}
                plan={plan}
                isCurrentPlan={isCurrent}
                onSelectPlan={handleSelectPlan}
              />
            );
          })}
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {paymentMethodModal && selectedPlanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-surface-low border border-white/10 p-6 shadow-2xl space-y-5">
            <div>
              <div className="text-xs font-mono uppercase text-primary font-bold">
                Select Checkout Method
              </div>
              <h3 className="text-xl font-heading font-bold text-content-primary mt-1">
                Upgrade to {selectedPlanForPayment.name} Plan
              </h3>
              <p className="text-xs text-content-dim mt-0.5">
                Total: ₹{selectedPlanForPayment.price} / month
              </p>
            </div>

            <div className="space-y-3">
              {/* Razorpay Option */}
              <button
                onClick={handleRazorpayCheckout}
                className="w-full p-4 rounded-2xl bg-surface border border-white/10 hover:border-primary/50 hover:bg-primary/5 flex items-center gap-4 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <span>Razorpay Instant Checkout</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                      Fastest
                    </span>
                  </div>
                  <div className="text-[11px] text-content-dim mt-0.5">
                    UPI, Credit/Debit Cards, NetBanking, Wallets. Instant activation.
                  </div>
                </div>
              </button>

              {/* Manual QR Option */}
              <button
                onClick={handleManualCheckout}
                className="w-full p-4 rounded-2xl bg-surface border border-white/10 hover:border-accent-cyan/50 hover:bg-accent-cyan/5 flex items-center gap-4 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary">
                    Manual UPI QR / Bank Transfer
                  </div>
                  <div className="text-[11px] text-content-dim mt-0.5">
                    Scan admin QR code, submit transaction UTR for admin approval.
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPaymentMethodModal(false)}
              className="w-full py-2.5 rounded-xl bg-surface border border-white/5 text-xs text-content-dim hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        plan={selectedPlanForPayment}
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSuccess={fetchPricingData}
      />
    </div>
  );
};

export default DeveloperPricingPage;
