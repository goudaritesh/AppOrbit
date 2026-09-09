import mongoose from 'mongoose';

/**
 * Review Model (Phase 9 Production Implementation)
 * Stores user ratings, reviews, verified download status, helpful counts, and developer replies.
 */
const reviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Application is required for a review'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for a review'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'PUBLISHED', 'PENDING', 'HIDDEN', 'REMOVED', 'FLAGGED'],
        message: '{VALUE} is not a valid review status',
      },
      default: 'ACTIVE',
      index: true,
    },
    isVerifiedDownload: {
      type: Boolean,
      default: false,
    },
    verifiedUsage: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative'],
    },
    reportCount: {
      type: Number,
      default: 0,
      min: [0, 'Report count cannot be negative'],
    },
    developerReply: {
      message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Developer reply cannot exceed 1000 characters'],
        default: null,
      },
      repliedAt: {
        type: Date,
        default: null,
      },
    },
    developerResponse: {
      message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Developer response cannot exceed 1000 characters'],
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
      developerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.virtual('appId').get(function () {
  return this.application;
});

reviewSchema.virtual('userId').get(function () {
  return this.user;
});

// One review per user per application
reviewSchema.index({ application: 1, user: 1 }, { unique: true });

// Compound indexes for querying and sorting
reviewSchema.index({ application: 1, status: 1, createdAt: -1 });
reviewSchema.index({ application: 1, status: 1, helpfulCount: -1 });
reviewSchema.index({ application: 1, status: 1, rating: -1 });
reviewSchema.index({ application: 1, status: 1, rating: 1 });
reviewSchema.index({ status: 1, reportCount: -1 });

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
