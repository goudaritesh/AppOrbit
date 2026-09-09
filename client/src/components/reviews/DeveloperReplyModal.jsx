import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeveloperReplyModal = ({ isOpen, review, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        reviewId: review._id,
        message: message.trim(),
      });
      toast.success('Developer response published');
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to publish reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Developer Response</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1">
          <span className="font-semibold text-slate-300">
            Replying to {review.user?.name || 'User'}'s review:
          </span>
          <p className="text-slate-400 italic line-clamp-2">"{review.comment}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Official Response Message *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Thank you for your feedback! We have addressed this in our latest update..."
              maxLength={1000}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Official Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeveloperReplyModal;
