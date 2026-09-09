import React from 'react';
import { ThumbsUp, ShieldCheck, Flag, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import RatingStars from './RatingStars';

export const ReviewCard = ({
  review,
  onVoteHelpful,
  onReport,
  onEdit,
  onDelete,
  onReply,
  isDeveloper = false,
}) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all duration-200">
      {/* Header: User Info & Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (review.user?.name || 'User')[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-100 text-sm">
                {review.user?.name || 'Anonymous User'}
              </span>
              {review.isVerifiedDownload && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Download</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{formattedDate}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          {review.isOwner && (
            <>
              <button
                type="button"
                onClick={() => onEdit && onEdit(review)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Edit review"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete && onDelete(review._id)}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onReport && onReport(review)}
            className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Report review"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rating & Content */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <RatingStars rating={review.rating} size="sm" />
          {review.title && (
            <h4 className="font-semibold text-slate-200 text-sm">{review.title}</h4>
          )}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      </div>

      {/* Developer Reply if present */}
      {review.developerReply?.message && (
        <div className="mt-3 pl-4 border-l-2 border-indigo-500/60 bg-indigo-950/20 p-3 rounded-r-xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-400 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Developer Response</span>
            </span>
            <span className="text-slate-500">
              {new Date(review.developerReply.repliedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {review.developerReply.message}
          </p>
        </div>
      )}

      {/* Footer: Helpful Vote & Developer Reply CTA */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
        <button
          type="button"
          onClick={() => onVoteHelpful && onVoteHelpful(review)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            review.hasVotedHelpful
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-medium'
              : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${review.hasVotedHelpful ? 'fill-indigo-400' : ''}`} />
          <span>Helpful</span>
          {review.helpfulCount > 0 && <span>({review.helpfulCount})</span>}
        </button>

        {isDeveloper && !review.developerReply?.message && (
          <button
            type="button"
            onClick={() => onReply && onReply(review)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Reply as Developer
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
