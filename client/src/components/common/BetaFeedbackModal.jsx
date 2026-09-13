import React, { useState } from 'react';
import {
  X,
  Bug,
  Lightbulb,
  Send,
  Star,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '../../api/adminApi';

export const BetaFeedbackModal = ({ isOpen, onClose, initialTab = 'feedback' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'bug' | 'feedback'
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Bug Report Form State
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'MEDIUM',
  });

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'FEATURE_REQUEST',
    category: 'DISCOVERY',
    rating: 5,
    message: '',
  });

  if (!isOpen) return null;

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    if (!bugForm.title.trim() || !bugForm.description.trim()) {
      toast.error('Please provide both a title and description');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.submitPublicBug({
        ...bugForm,
        deviceInfo: {
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser',
          os: navigator.platform || 'Web',
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        },
      });
      setSubmittedSuccess(true);
      toast.success('Bug report logged! Thank you for helping improve AppOrbit.');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setBugForm({
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedResult: '',
          actualResult: '',
          severity: 'MEDIUM',
        });
        onClose();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      toast.error('Please share a brief message describing your feedback');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.submitPublicFeedback(feedbackForm);
      setSubmittedSuccess(true);
      toast.success('Feedback recorded! Thank you for shaping AppOrbit Beta.');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setFeedbackForm({
          type: 'FEATURE_REQUEST',
          category: 'DISCOVERY',
          rating: 5,
          message: '',
        });
        onClose();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-surface border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface-low">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary text-primary border border-brand-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-bold text-white">AppOrbit Beta Hub</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                  v0.8.0-BETA
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">Help us polish the platform for launch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-content-muted hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-surface-low/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'feedback'
                ? 'bg-primary text-white shadow-md'
                : 'text-content-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Give Feedback & Ideas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bug')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bug'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-content-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Bug className="w-4 h-4" />
            Report a Bug
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {submittedSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-scaleUp">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Thank You!</h4>
              <p className="text-xs text-content-muted max-w-xs">
                Your report has been received and routed to our developer operations team.
              </p>
            </div>
          ) : activeTab === 'feedback' ? (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Feedback Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '💡 Feature Request', val: 'FEATURE_REQUEST' },
                    { label: '⭐ General Feedback', val: 'GENERAL_FEEDBACK' },
                    { label: '🎨 UI / UX Polish', val: 'UI_UX' },
                    { label: '⚡ Performance', val: 'PERFORMANCE' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, type: t.val })}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-colors ${
                        feedbackForm.type === t.val
                          ? 'bg-primary/20 border-primary text-primary font-bold'
                          : 'bg-surface-low border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  How would you rate your beta experience?
                </label>
                <div className="flex items-center gap-1.5 bg-surface-low p-2.5 rounded-2xl border border-white/10 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackForm.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">
                    {feedbackForm.rating} / 5
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Suggestions / Thoughts
                </label>
                <textarea
                  rows={4}
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  placeholder="Tell us what you liked, what felt confusing, or what features you want next..."
                  className="w-full bg-surface-low border border-white/10 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Send Feedback'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBugSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem Title</label>
                <input
                  type="text"
                  value={bugForm.title}
                  onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
                  placeholder="e.g. APK download hangs on mobile browser"
                  className="w-full bg-surface-low border border-white/10 rounded-2xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 'LOW', label: 'Low', color: 'border-blue-500/40 text-blue-400' },
                    { val: 'MEDIUM', label: 'Medium', color: 'border-amber-500/40 text-amber-400' },
                    { val: 'HIGH', label: 'High', color: 'border-orange-500/40 text-orange-400' },
                    { val: 'CRITICAL', label: 'Critical', color: 'border-rose-500/40 text-rose-400' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setBugForm({ ...bugForm, severity: s.val })}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                        bugForm.severity === s.val
                          ? 'bg-white/10 ' + s.color
                          : 'bg-surface-low border-white/10 text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">What happened?</label>
                <textarea
                  rows={3}
                  value={bugForm.description}
                  onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                  placeholder="Describe the unexpected behavior..."
                  className="w-full bg-surface-low border border-white/10 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bugForm.stepsToReproduce}
                  onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
                  placeholder="1. Open app details\n2. Click download button\n3. Notice failure..."
                  className="w-full bg-surface-low border border-white/10 rounded-2xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Bug className="w-4 h-4" />
                {submitting ? 'Submitting Bug...' : 'Submit Bug Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetaFeedbackModal;
