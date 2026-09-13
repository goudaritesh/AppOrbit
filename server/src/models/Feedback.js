import mongoose from 'mongoose';

/**
 * Beta Feedback Model (Sprint 12)
 * Collects categorized user & developer feedback, ratings, and feature suggestions.
 */
const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Anonymous Beta Tester',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['USER', 'DEVELOPER', 'ADMIN', 'GUEST'],
      default: 'USER',
      index: true,
    },
    type: {
      type: String,
      enum: [
        'BUG',
        'FEATURE_REQUEST',
        'GENERAL_FEEDBACK',
        'UI_UX',
        'PERFORMANCE',
        'SECURITY',
      ],
      default: 'GENERAL_FEEDBACK',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'DISCOVERY',
        'PUBLISHING',
        'DOWNLOADS',
        'DASHBOARD',
        'ANALYTICS',
        'PAYMENTS',
        'OTHER',
      ],
      default: 'GENERAL_FEEDBACK',
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    status: {
      type: String,
      enum: [
        'NEW',
        'REVIEWED',
        'UNDER_CONSIDERATION',
        'PLANNED',
        'RESOLVED',
        'DISMISSED',
      ],
      default: 'NEW',
      index: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    adminResponse: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
feedbackSchema.index({ type: 1, status: 1 });
feedbackSchema.index({ rating: -1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
