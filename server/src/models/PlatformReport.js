import mongoose from 'mongoose';

/**
 * Platform Report Model (Phase 7 Production Implementation)
 * Consumer and developer reports for malicious apps, copyright infringement, broken downloads, etc.
 */
const platformReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['APP', 'DEVELOPER', 'USER'],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'MALICIOUS_APP',
        'BROKEN_DOWNLOAD',
        'FAKE_APP',
        'COPYRIGHT',
        'INAPPROPRIATE_CONTENT',
        'SPAM',
        'SECURITY_CONCERN',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

platformReportSchema.index({ createdAt: -1, status: 1 });

export const PlatformReport = mongoose.model('PlatformReport', platformReportSchema);
export default PlatformReport;
