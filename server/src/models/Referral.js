import mongoose from 'mongoose';

/**
 * Referral Model (Sprint 13)
 * Tracks developer and user invitation loops, activation milestones,
 * and bonus publishing slot allocations.
 */
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referrer user is required'],
      index: true,
    },
    referralCode: {
      type: String,
      required: [true, 'Referral code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    refereeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    refereeRole: {
      type: String,
      enum: ['USER', 'DEVELOPER', 'PENDING'],
      default: 'PENDING',
    },
    status: {
      type: String,
      enum: ['PENDING', 'REGISTERED', 'ACTIVATED_FIRST_APP', 'REWARDED'],
      default: 'PENDING',
      index: true,
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
    rewardType: {
      type: String,
      enum: ['EXTRA_APP_SLOT', 'EXTENDED_PRO_TRIAL', 'COMMUNITY_BADGE', 'NONE'],
      default: 'EXTRA_APP_SLOT',
    },
    activatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ referrer: 1, referee: 1 });

export const Referral = mongoose.model('Referral', referralSchema);
export default Referral;
