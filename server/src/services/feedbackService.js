import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/pagination.js';

export class FeedbackService {
  /**
   * Submits a user feedback or feature request
   */
  static async submitFeedback({
    user = null,
    name = '',
    email = '',
    role = 'USER',
    type = 'GENERAL_FEEDBACK',
    category = 'OTHER',
    rating = 5,
    message = '',
  }) {
    if (!message || message.trim().length === 0) {
      const err = new Error('Feedback message is required');
      err.statusCode = 400;
      throw err;
    }

    let finalName = name;
    let finalEmail = email;
    let finalRole = role;

    if (user) {
      finalName = user.name || name || 'Beta Tester';
      finalEmail = user.email || email;
      finalRole = user.role || role;
    }

    const feedback = await Feedback.create({
      user: user?._id || null,
      name: finalName || 'Anonymous Beta Tester',
      email: finalEmail || '',
      role: finalRole || 'USER',
      type,
      category,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      message: message.trim(),
      status: 'NEW',
    });

    return feedback;
  }

  /**
   * Retrieves paginated feedback list for administration
   */
  static async getFeedbacks(query = {}) {
    const { page, limit, skip } = getPaginationParams(query, 10, 100);
    const filter = {};

    if (query.type && query.type !== 'ALL') {
      filter.type = query.type;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    if (query.rating) {
      filter.rating = Number(query.rating);
    }

    if (query.search) {
      filter.$or = [
        { message: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'name email role profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return formatPaginationResponse({ data, total, page, limit });
  }

  /**
   * Updates feedback status and admin response notes
   */
  static async updateFeedbackStatus(feedbackId, { status, adminNotes, adminResponse }) {
    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (adminResponse !== undefined) updates.adminResponse = adminResponse;

    const feedback = await Feedback.findByIdAndUpdate(feedbackId, updates, { new: true });
    if (!feedback) {
      const err = new Error('Feedback not found');
      err.statusCode = 404;
      throw err;
    }
    return feedback;
  }

  /**
   * Upvotes a feedback / feature request
   */
  static async upvoteFeedback(feedbackId) {
    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    return feedback;
  }
}

export default FeedbackService;
