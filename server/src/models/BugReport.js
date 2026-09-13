import mongoose from 'mongoose';

/**
 * Beta Bug Report Model (Sprint 12)
 * Manages structured bug submissions, reproduction steps, severity grading,
 * and resolution workflows.
 */
const bugReportSchema = new mongoose.Schema(
  {
    bugId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Bug report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    stepsToReproduce: {
      type: String,
      trim: true,
      default: '',
    },
    expectedResult: {
      type: String,
      trim: true,
      default: '',
    },
    actualResult: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reporterName: {
      type: String,
      default: 'Anonymous Tester',
    },
    reporterEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    reporterRole: {
      type: String,
      enum: ['USER', 'DEVELOPER', 'ADMIN', 'GUEST'],
      default: 'USER',
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      default: null,
      index: true,
    },
    deviceInfo: {
      os: { type: String, default: '' },
      browser: { type: String, default: '' },
      deviceType: { type: String, default: '' },
      screenResolution: { type: String, default: '' },
    },
    screenshots: {
      type: [String],
      default: [],
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save generator for readable bugId: BUG-1001, BUG-1002, etc.
bugReportSchema.pre('save', async function (next) {
  if (!this.bugId) {
    const count = await mongoose.model('BugReport').countDocuments();
    this.bugId = `BUG-${1000 + count + 1}`;
  }
  next();
});

// Indexes for triage queues
bugReportSchema.index({ severity: 1, status: 1 });
bugReportSchema.index({ createdAt: -1 });

export const BugReport = mongoose.model('BugReport', bugReportSchema);
export default BugReport;
