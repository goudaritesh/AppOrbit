import mongoose from 'mongoose';

/**
 * Review Vote Model (Phase 9)
 * Records helpful votes on reviews to ensure 1 vote per user per review.
 */
const reviewVoteSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Review is required for a vote'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for a vote'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one vote per user per review
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

export const ReviewVote = mongoose.model('ReviewVote', reviewVoteSchema);
export default ReviewVote;
