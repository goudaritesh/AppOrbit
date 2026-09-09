import React, { useState } from 'react';
import ReviewCard from './ReviewCard';
import { MessageSquare, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const ReviewList = ({
  reviews = [],
  pagination = { page: 1, pages: 1, total: 0 },
  onPageChange,
  onSortChange,
  onRatingFilterChange,
  currentSort = 'recent',
  currentRatingFilter = '',
  onVoteHelpful,
  onReport,
  onEdit,
  onDelete,
  onReply,
  isDeveloper = false,
}) => {
  return (
    <div className="space-y-5">
      {/* Controls Bar: Filter & Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Rating Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onRatingFilterChange('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentRatingFilter === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingFilterChange(String(star))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentRatingFilter === String(star)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              {star} ★
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400 font-medium">Sort:</span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Review Cards */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onVoteHelpful={onVoteHelpful}
              onReport={onReport}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              isDeveloper={isDeveloper}
            />
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} reviews)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange(pagination.page - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => onPageChange(pagination.page + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 px-4 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-300">No reviews found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {currentRatingFilter
              ? `There are no ${currentRatingFilter}-star reviews yet.`
              : 'Be the first person to share your experience with this application!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
