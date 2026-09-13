import mongoose from 'mongoose';

/**
 * App Schema (Phase 3 Production Implementation)
 * Production-ready application registry for Android distribution.
 * Designed for future APK upload integration and version lifecycle tracking.
 */
const screenshotSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const currentVersionSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    versionCode: {
      type: Number,
      default: 1,
    },
    releaseNotes: {
      type: String,
      default: 'Initial release',
      trim: true,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    fileSize: {
      type: String,
      default: '20.0 MB',
      trim: true,
    },
    minAndroid: {
      type: String,
      default: 'Android 8.0 (API 26)',
      trim: true,
    },
  },
  { _id: false }
);

const demoVideoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['youtube', 'vimeo', 'direct'],
      default: 'youtube',
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    provider: {
      type: String,
      default: 'youtube',
      trim: true,
    },
  },
  { _id: false }
);

const appSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Application name is required'],
      trim: true,
      maxlength: [100, 'Application name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Application slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [10000, 'Description cannot exceed 10,000 characters'],
    },
    icon: {
      type: String,
      default: '',
      trim: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application developer is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Application category is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    platform: {
      type: String,
      enum: {
        values: ['ANDROID', 'WEB', 'IOS'],
        message: '{VALUE} is not a supported platform',
      },
      default: 'ANDROID',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'DRAFT',
          'SUBMITTED',
          'PENDING_REVIEW',
          'UNDER_REVIEW',
          'CHANGES_REQUESTED',
          'APPROVED',
          'REJECTED',
          'BLOCKED',
          'SUSPENDED',
          'ARCHIVED',
          'PUBLISHED',
        ],
        message: '{VALUE} is not a valid application status',
      },
      default: 'DRAFT',
      index: true,
    },
    moderation: {
      reviewHistory: [
        {
          action: {
            type: String,
            enum: [
              'SUBMITTED',
              'UNDER_REVIEW',
              'APPROVED',
              'REJECTED',
              'CHANGES_REQUESTED',
              'BLOCKED',
              'PUBLISHED',
              'UNPUBLISHED',
              'ARCHIVED',
            ],
          },
          admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          adminName: { type: String, default: '' },
          adminEmail: { type: String, default: '' },
          reason: { type: String, default: '' },
          category: { type: String, default: '' },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      rejectionCategory: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
      blockCategory: { type: String, default: '' },
      blockReason: { type: String, default: '' },
      changesRequestedReason: { type: String, default: '' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
    },
    review: {
      status: { type: String, default: null },
      reason: { type: String, default: '' },
      comment: { type: String, default: '' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
    },
    visibility: {
      type: String,
      enum: {
        values: ['PUBLIC', 'UNLISTED', 'PRIVATE'],
        message: '{VALUE} is not a valid visibility setting',
      },
      default: 'PUBLIC',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'UNVERIFIED',
      index: true,
    },
    features: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
    },
    screenshots: {
      type: [screenshotSchema],
      default: [],
    },
    demoVideo: {
      type: demoVideoSchema,
      default: () => ({}),
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    demoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    currentVersion: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'AppVersion',
      default: null,
    },
    packageName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    versionHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, 'Download count cannot be negative'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative'],
    },
    ratingDistribution: {
      1: { type: Number, default: 0, min: 0 },
      2: { type: Number, default: 0, min: 0 },
      3: { type: Number, default: 0, min: 0 },
      4: { type: Number, default: 0, min: 0 },
      5: { type: Number, default: 0, min: 0 },
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredOrder: {
      type: Number,
      default: 0,
    },
    // Sprint 13 App Badging & College Project Highlighting
    badge: {
      type: String,
      enum: ['NONE', 'FEATURED', 'TRENDING', 'EDITORS_CHOICE', 'STUDENT_PROJECT', 'NEW_RELEASE'],
      default: 'NONE',
      index: true,
    },
    isStudentProject: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
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

appSchema.virtual('ratingStats').get(function () {
  return {
    average: this.ratingAverage || 0,
    totalRatings: this.ratingCount || 0,
    distribution: this.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
});

// Compound indexes for optimal marketplace discovery and sorting
appSchema.index({ status: 1, visibility: 1, publishedAt: -1 });
appSchema.index({ status: 1, visibility: 1, downloadCount: -1 });
appSchema.index({ status: 1, visibility: 1, ratingAverage: -1 });
appSchema.index({ category: 1, status: 1, visibility: 1 });
appSchema.index({ featured: 1, status: 1, visibility: 1, featuredOrder: 1 });

// Developer portal compound indexes
appSchema.index({ developer: 1, updatedAt: -1 });
appSchema.index({ developer: 1, status: 1 });
appSchema.index({ developer: 1, createdAt: -1 });

// Full text index for multi-field search
appSchema.index({
  name: 'text',
  shortDescription: 'text',
  tags: 'text',
});

export const App = mongoose.model('App', appSchema);
export default App;
