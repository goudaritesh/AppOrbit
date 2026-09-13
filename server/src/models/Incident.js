import mongoose from 'mongoose';

/**
 * Platform Incident Model (Sprint 12 Priority 12)
 * Manages production outage tracking, post-mortem analysis, and internal resolution status.
 */
const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'],
      default: 'INVESTIGATING',
      index: true,
    },
    affectedComponents: {
      type: [String],
      default: ['CORE_API'],
    },
    affectedUsersEstimate: {
      type: Number,
      default: 0,
    },
    rootCause: {
      type: String,
      default: '',
      trim: true,
    },
    solution: {
      type: String,
      default: '',
      trim: true,
    },
    timeline: [
      {
        timestamp: { type: Date, default: Date.now },
        message: { type: String, required: true },
        author: { type: String, default: 'System Operator' },
      },
    ],
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

// Pre-save generator for readable incidentId: INC-2026-001, etc.
incidentSchema.pre('save', async function (next) {
  if (!this.incidentId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Incident').countDocuments();
    const seq = String(count + 1).padStart(3, '0');
    this.incidentId = `INC-${year}-${seq}`;
  }
  next();
});

export const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
