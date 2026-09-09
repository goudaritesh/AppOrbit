import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  CheckCircle,
  EyeOff,
  Trash2,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import reviewsApi from '../../api/reviewsApi';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews(1);
  }, [statusFilter]);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const res = await reviewsApi.getAdminReviews({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setReviews(res.data.data.reviews || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load reviews for moderation');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId, newStatus) => {
    try {
      await reviewsApi.moderateReview(reviewId, {
        status: newStatus,
        reason: `Admin moderation action: ${newStatus}`,
      });
      toast.success(`Review status updated to ${newStatus}`);
      fetchReviews(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SEOHead title="Review Moderation — Admin Control" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <MessageSquare className="w-7 h-7 text-indigo-400" />
            <span>Review Moderation Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit user ratings, community flags, and enforce platform trust standards.
          </p>
        </div>

        {/* Status Filter Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="">All Review Statuses</option>
            <option value="ACTIVE">Active Reviews</option>
            <option value="FLAGGED">Flagged / Reported</option>
            <option value="PENDING">Pending Approval</option>
            <option value="HIDDEN">Hidden</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>
      </div>

      {/* Reviews Moderation Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User & App</th>
                  <th className="py-3.5 px-4 font-semibold">Rating & Review</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Reports</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reviews.map((review) => {
                  const statusColors = {
                    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    FLAGGED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    PENDING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    HIDDEN: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                    REMOVED: 'bg-red-500/10 text-red-400 border-red-500/20',
                  };

                  return (
                    <tr key={review._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* User & App Info */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-white text-sm">
                          {review.user?.name || 'User'}
                        </div>
                        <div className="text-slate-400">{review.user?.email}</div>
                        <div className="text-indigo-400 font-medium">
                          App: {review.application?.name || 'Unknown App'}
                        </div>
                      </td>

                      {/* Content */}
                      <td className="py-4 px-4 space-y-1.5 max-w-md">
                        <div className="flex items-center space-x-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= review.rating ? 'fill-amber-400' : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          {review.title && (
                            <span className="font-bold text-slate-200 text-xs">
                              {review.title}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">
                          {review.comment}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[review.status] || statusColors.ACTIVE
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>

                      {/* Reports */}
                      <td className="py-4 px-4 font-mono font-bold">
                        {review.reportCount > 0 ? (
                          <span className="text-amber-400 flex items-center space-x-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{review.reportCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>

                      {/* Moderation Controls */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {review.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleModerate(review._id, 'ACTIVE')}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                              title="Approve / Restore to Active"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {review.status !== 'HIDDEN' && (
                            <button
                              type="button"
                              onClick={() => handleModerate(review._id, 'HIDDEN')}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                              title="Hide Review"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          {review.status !== 'REMOVED' && (
                            <button
                              type="button"
                              onClick={() => handleModerate(review._id, 'REMOVED')}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="Remove Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No reviews matching the selected filter.
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchReviews(pagination.page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchReviews(pagination.page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviewsPage;
