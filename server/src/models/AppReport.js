import mongoose from 'mongoose';

/**
 * AppReport Model (Sprint 4 Safety & Trust System)
 * Stores user and community reports filed against suspicious or malicious applications.
 */
const appReportSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: [true, 'Reported application ID is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reason: {
      type: String,
      enum: {
        values: [
          'SUSPICIOUS_BEHAVIOR',
          'POSSIBLE_MALWARE',
          'FAKE_APPLICATION',
          'MISLEADING_DESCRIPTION',
          'COPYRIGHT_ISSUE',
          'OTHER',
        ],
        message: '{VALUE} is not a supported report reason',
      },
      required: [true, 'Report reason is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      maxlength: [2000, 'Description cannot exceed 2,000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
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

export const AppReport = mongoose.model('AppReport', appReportSchema);
export default AppReport;
