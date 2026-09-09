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
    type: {
      type: String,
      enum: ['HELPFUL'],
      default: 'HELPFUL',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewVoteSchema.virtual('reviewId').get(function () {
  return this.review;
});

reviewVoteSchema.virtual('userId').get(function () {
  return this.user;
});

// Unique index: one vote per user per review
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

export const ReviewVote = mongoose.model('ReviewVote', reviewVoteSchema);
export default ReviewVote;
