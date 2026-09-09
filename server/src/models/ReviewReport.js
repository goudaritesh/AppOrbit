import mongoose from 'mongoose';

/**
 * Review Report Model (Phase 9)
 * Records user reports of inappropriate reviews for administrator moderation.
 */
const reviewReportSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Review is required for a report'],
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: {
        values: [
          'SPAM',
          'FAKE_REVIEW',
          'OFFENSIVE_LANGUAGE',
          'ABUSIVE',
          'HARASSMENT',
          'IRRELEVANT_CONTENT',
          'MISLEADING',
          'INAPPROPRIATE',
          'OTHER',
        ],
        message: '{VALUE} is not a valid report reason',
      },
      required: [true, 'Report reason is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REVIEWED', 'DISMISSED'],
        message: '{VALUE} is not a valid report status',
      },
      default: 'OPEN',
      index: true,
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
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active reports by the same user on the same review
reviewReportSchema.index({ review: 1, reporter: 1, status: 1 });
reviewReportSchema.index({ status: 1, createdAt: -1 });

export const ReviewReport = mongoose.model('ReviewReport', reviewReportSchema);
export default ReviewReport;
