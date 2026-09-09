import React, { useState, useEffect } from 'react';
import RatingStars from './RatingStars';
import toast from 'react-hot-toast';

export const ReviewForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  isEdit = false,
}) => {
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 5);
      setTitle(initialData.title || '');
      setComment(initialData.comment || '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      toast.error('Review comment must be at least 10 characters');
      return;
    }

    onSubmit({
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {isEdit ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <span className="text-xs text-slate-400">Share your honest feedback</span>
      </div>

      {/* Star Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Your Rating
        </label>
        <div className="flex items-center space-x-3">
          <RatingStars rating={rating} onChange={setRating} interactive={true} size="lg" />
          <span className="text-sm font-bold text-amber-400">
            {rating === 5 && 'Outstanding'}
            {rating === 4 && 'Very Good'}
            {rating === 3 && 'Average'}
            {rating === 2 && 'Below Average'}
            {rating === 1 && 'Poor'}
          </span>
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Review Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Incredibly fast and intuitive UI!"
          maxLength={100}
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Comment Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Review Comment *
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {comment.length} / 1000 (min 10 chars)
          </span>
        </div>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? How does it perform?"
          maxLength={1000}
          required
          className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all duration-150"
        >
          {submitting ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
