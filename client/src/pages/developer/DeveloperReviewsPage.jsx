import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Send,
  CornerDownRight,
  ThumbsUp,
  RefreshCw,
  X,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import reviewsApi from '../../api/reviewsApi';
import RatingStars from '../../components/reviews/RatingStars';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const DeveloperReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    responseRate: 0,
    awaitingResponse: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedResponded, setSelectedResponded] = useState('');
  const [selectedSort, setSelectedSort] = useState('recent');

  // Response Modal
  const [activeModalReview, setActiveModalReview] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchReviews(1);
  }, [selectedAppId, selectedRating, selectedResponded, selectedSort]);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const res = await reviewsApi.getDeveloperReviews({
        appId: selectedAppId || undefined,
        rating: selectedRating || undefined,
        responded: selectedResponded || undefined,
        sort: selectedSort,
        page,
        limit: 15,
      });

      const data = res.data?.data || {};
      setReviews(data.reviews || []);
      setApps(data.apps || []);
      setStats(data.stats || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        awaitingResponse: 0,
      });
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load developer reviews:', err);
      toast.error('Unable to load community reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReplyModal = (review) => {
    setActiveModalReview(review);
    setReplyMessage(
      review.developerResponse?.message || review.developerReply?.message || ''
    );
  };

  const handleCloseReplyModal = () => {
    setActiveModalReview(null);
    setReplyMessage('');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }

    setSubmittingReply(true);
    try {
      await reviewsApi.respondReview(activeModalReview._id, {
        message: replyMessage.trim(),
      });
      toast.success('Official developer response posted successfully!');
      handleCloseReplyModal();
      fetchReviews(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post response');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead title="Community Reviews — Developer Console" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-indigo-400" />
            <span>Community Feedback & Reviews</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor ratings, engage with users, and post official responses to community reviews.
          </p>
        </div>

        <button
          onClick={() => fetchReviews(pagination.page)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Rating */}
        <div className="p-5 rounded-2xl bg-surface border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Rating</span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <RatingStars rating={Math.round(stats.averageRating || 0)} size="sm" />
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="p-5 rounded-2xl bg-surface border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Reviews</span>
            <MessageSquare className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalReviews.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Across all published apps</div>
        </div>

        {/* Card 3: Response Rate */}
        <div className="p-5 rounded-2xl bg-surface border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Response Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.responseRate}%</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.responseRate}%` }}
            />
          </div>
        </div>

        {/* Card 4: Awaiting Response */}
        <div className="p-5 rounded-2xl bg-surface border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Awaiting Response</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {stats.awaitingResponse.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-indigo-400 font-medium">
            {stats.awaitingResponse > 0 ? 'Action suggested' : 'All caught up!'}
          </div>
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* App Selector */}
          <div className="flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="">All Applications</option>
              {apps.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedRating('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedRating === ''
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRating(String(star))}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedRating === String(star)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>

          {/* Response Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedResponded}
              onChange={(e) => setSelectedResponded(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="">All Response Statuses</option>
              <option value="false">Awaiting Response</option>
              <option value="true">Responded</option>
            </select>
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sort:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-surface rounded-2xl border border-white/5">
            Loading community reviews...
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => {
            const hasReply = !!(rev.developerResponse?.message || rev.developerReply?.message);
            const replyContent = rev.developerResponse?.message || rev.developerReply?.message;
            const replyDate = rev.developerResponse?.respondedAt || rev.developerReply?.repliedAt;

            return (
              <div
                key={rev._id}
                className="p-6 bg-surface border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all duration-200"
              >
                {/* Header: App Context & Reviewer Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {/* App icon / badge */}
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {rev.application?.icon ? (
                        <img
                          src={rev.application.icon}
                          alt={rev.application.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-sm text-primary">
                          {rev.application?.name?.[0] || 'A'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {rev.application?.name || 'Application'}
                        </span>
                        {rev.isVerifiedDownload && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Download</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>By {rev.user?.name || rev.user?.username || 'Community User'}</span>
                        <span>•</span>
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Helpful badge */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-xs font-bold text-amber-400 ml-1">
                        {rev.rating}.0
                      </span>
                    </div>

                    {rev.helpfulCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{rev.helpfulCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Body */}
                <div className="space-y-1.5">
                  {rev.title && (
                    <h4 className="text-sm font-bold text-slate-100">{rev.title}</h4>
                  )}
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                </div>

                {/* Official Developer Response (if present) */}
                {hasReply && (
                  <div className="mt-3 pl-4 border-l-2 border-indigo-500 bg-indigo-950/20 p-4 rounded-r-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Official Developer Response</span>
                      </span>
                      {replyDate && (
                        <span className="text-slate-500 text-[11px]">
                          {new Date(replyDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed mt-1">
                      {replyContent}
                    </p>
                  </div>
                )}

                {/* CTA Action */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{hasReply ? 'Edit Response' : 'Respond to Review'}</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center bg-surface rounded-2xl border border-white/5 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Reviews Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No reviews match your selected filter criteria. When users rate your applications, they will appear here.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs font-mono text-slate-400">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} reviews)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchReviews(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchReviews(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Developer Response Modal */}
      {activeModalReview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Respond to Community Review
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReplyModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Review Snippet */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {activeModalReview.user?.name || 'User'}
                </span>
                <div className="flex items-center gap-1">
                  <RatingStars rating={activeModalReview.rating} size="sm" />
                </div>
              </div>
              <p className="text-xs text-slate-400 italic line-clamp-3">
                "{activeModalReview.comment}"
              </p>
            </div>

            {/* Response Form */}
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Your Official Response
                </label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Thank the user, address their feedback, or explain upcoming improvements..."
                  maxLength={1000}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Keep responses polite and professional.</span>
                  <span>{replyMessage.length} / 1000</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReplyModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyMessage.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Posting...' : 'Post Response'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperReviewsPage;
