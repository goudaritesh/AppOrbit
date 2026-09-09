import React, { useState } from 'react';
import { Flag, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { apiClient } from '../../api/axios';

const REPORT_REASONS = [
  { id: 'SUSPICIOUS_BEHAVIOR', label: 'Suspicious Behavior', desc: 'App attempts unusual actions or crashes device' },
  { id: 'POSSIBLE_MALWARE', label: 'Possible Malware / Adware', desc: 'Contains aggressive adware, spyware, or malicious code' },
  { id: 'FAKE_APPLICATION', label: 'Fake Application', desc: 'Impersonating another brand, company, or developer' },
  { id: 'MISLEADING_DESCRIPTION', label: 'Misleading Description', desc: 'Features described do not match actual app functionality' },
  { id: 'COPYRIGHT_ISSUE', label: 'Copyright or IP Infringement', desc: 'Uses unauthorized assets or intellectual property' },
  { id: 'OTHER', label: 'Other Safety Concern', desc: 'Other policy violation or dangerous content' },
];

export const ReportAppModal = ({
  isOpen,
  onClose,
  appId,
  appName = 'this application',
}) => {
  const [reason, setReason] = useState('SUSPICIOUS_BEHAVIOR');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide details explaining why you are reporting this application.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/apps/${appId}/report`, {
        reason,
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report "${appName}"`}
    >
      {success ? (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-content-primary">
            Report Submitted for Admin Review
          </h4>
          <p className="text-xs text-content-muted">
            Thank you for helping keep the AppOrbit community safe. Our security team will investigate this report.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-content-muted">
            If you believe this application violates safety guidelines or presents security risks, let our security administrators know.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-content-primary">
              Select Reason
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reason === r.id
                      ? 'bg-primary/10 border-primary text-content-primary'
                      : 'bg-surface-elevated/40 border-white/5 text-content-secondary hover:border-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{r.label}</span>
                    <span className="text-[11px] text-content-muted">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-content-primary">
              Detailed Explanation
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, suspicious behavior, or violation in detail..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
              className="bg-accent-rose hover:bg-accent-rose/90 text-white"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReportAppModal;
