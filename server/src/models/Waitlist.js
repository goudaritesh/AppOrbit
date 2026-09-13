import mongoose from 'mongoose';

/**
 * Waitlist Model (Sprint 13)
 * Collects early access requests, role preferences, and interest tags
 * for the official AppOrbit v1.0 Launch.
 */
const waitlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    role: {
      type: String,
      enum: ['DEVELOPER', 'USER', 'STUDENT', 'CREATOR'],
      default: 'USER',
      index: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    referralCode: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'INVITED', 'ONBOARDED'],
      default: 'CONFIRMED',
      index: true,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    invitedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

waitlistSchema.index({ createdAt: -1 });

export const Waitlist = mongoose.model('Waitlist', waitlistSchema);
export default Waitlist;
