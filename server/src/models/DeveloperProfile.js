import mongoose from 'mongoose';

/**
 * DeveloperProfile Schema
 * Maintains developer verification, organization details, and public developer identity.
 */
const developerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    developerStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'SUSPENDED', 'BANNED'],
        message: '{VALUE} is not a valid developer status',
      },
      default: 'ACTIVE',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'UNVERIFIED',
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    githubProfile: {
      type: String,
      trim: true,
      default: '',
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    developerBio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Developer bio cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

developerProfileSchema.index({ verificationStatus: 1 });

export const DeveloperProfile = mongoose.model('DeveloperProfile', developerProfileSchema);
export default DeveloperProfile;
