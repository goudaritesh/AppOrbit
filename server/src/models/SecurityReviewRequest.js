import mongoose from 'mongoose';

/**
 * SecurityReviewRequest Schema (Phase 6 Production Implementation)
 * Allows developers to request manual human review for flagged or review-required versions.
 */
const securityReviewRequestSchema = new mongoose.Schema(
  {
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppVersion',
      required: [true, 'AppVersion reference is required'],
      index: true,
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Parent application reference is required'],
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Developer reference is required'],
      index: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityReport',
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Reason for review request is required'],
      trim: true,
      maxlength: [2000, 'Review reason cannot exceed 2,000 characters'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'OPEN',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Admin notes cannot exceed 5,000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

securityReviewRequestSchema.index({ version: 1, developer: 1, status: 1 });
securityReviewRequestSchema.index({ status: 1, createdAt: -1 });

export const SecurityReviewRequest = mongoose.model('SecurityReviewRequest', securityReviewRequestSchema);
export default SecurityReviewRequest;
