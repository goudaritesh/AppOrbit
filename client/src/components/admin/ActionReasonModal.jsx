import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ActionReasonModal
 * Modal prompting administrator for mandatory justification, categories, or suspension params.
 */
export const ActionReasonModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Confirm Action',
  description = 'Please provide justification for this administrative operation.',
  confirmText = 'Confirm',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  showCategory = false,
  categories = [],
  showSuspensionTypes = false,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [suspensionType, setSuspensionType] = useState('INDEFINITE');
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Justification reason is mandatory.');
      return;
    }

    setError('');
    onSubmit({
      reason: reason.trim(),
      category: showCategory ? category : undefined,
      type: showSuspensionTypes ? suspensionType : undefined,
      durationDays: showSuspensionTypes && suspensionType === 'TEMPORARY' ? durationDays : undefined,
    });
  };

  const buttonStyles = {
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold',
    primary: 'bg-primary hover:bg-primary-hover text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-content-muted hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-content-primary">{title}</h3>
            <p className="text-xs text-content-muted">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showCategory && categories.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-content-muted mb-1.5">
                Category Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-sm focus:outline-none focus:border-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showSuspensionTypes && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-content-muted mb-1.5">
                  Suspension Duration
                </label>
                <select
                  value={suspensionType}
                  onChange={(e) => setSuspensionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-sm focus:outline-none focus:border-primary"
                >
                  <option value="INDEFINITE">Indefinite</option>
                  <option value="TEMPORARY">Temporary</option>
                </select>
              </div>

              {suspensionType === 'TEMPORARY' && (
                <div>
                  <label className="block text-xs font-mono text-content-muted mb-1.5">
                    Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-content-muted mb-1.5">
              Reason / Reviewer Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Provide detailed justification for the audit trail and developer notification..."
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-content-muted hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                buttonStyles[confirmVariant] || buttonStyles.danger
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionReasonModal;
