import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * User Schema (Phase 2 Production Implementation)
 * Supports USER, DEVELOPER, ADMIN, and SUPER_ADMIN roles with enterprise security.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === 'LOCAL';
        },
        'Please provide a password',
      ],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: [
          'USER',
          'DEVELOPER',
          'ADMIN',
          'SUPER_ADMIN',
          'MODERATOR',
          'SECURITY_REVIEWER',
          'SUPPORT_AGENT',
          'FINANCE_ADMIN',
        ],
        message: '{VALUE} is not a valid platform role',
      },
      default: 'USER',
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'SUSPENDED', 'RESTRICTED', 'BANNED', 'PENDING_VERIFICATION'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    suspensionType: {
      type: String,
      enum: ['NONE', 'TEMPORARY', 'INDEFINITE'],
      default: 'NONE',
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    restrictedFeatures: {
      type: [String],
      default: [],
    },
    adminNotes: [
      {
        note: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    emailVerified: {
      type: Boolean,
      default: false,
    },
    freeTrialUsed: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
    },
    verificationLevel: {
      type: String,
      enum: ['UNVERIFIED', 'EMAIL_VERIFIED', 'VERIFIED', 'TRUSTED'],
      default: 'UNVERIFIED',
    },
    profileImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    portfolioUrl: {
      type: String,
      default: '',
    },
    // Store hashed refresh tokens to support multi-device sessions and revocation
    refreshTokens: [
      {
        tokenHash: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        userAgent: String,
        ip: String,
      },
    ],
    passwordChangedAt: Date,
    lastLogin: Date,

    // Email verification fields
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Sprint 11 Account Protection & Lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // Sprint 12 Beta Program Metadata
    isBetaTester: {
      type: Boolean,
      default: false,
      index: true,
    },
    betaJoinedAt: {
      type: Date,
      default: null,
    },
    betaStage: {
      type: String,
      enum: ['NONE', 'APPLIED', 'INVITED', 'ACTIVE', 'GRADUATED'],
      default: 'NONE',
      index: true,
    },

    // Sprint 13 Referral & Invitation Metadata
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    referralStats: {
      totalReferred: { type: Number, default: 0 },
      activatedDevelopers: { type: Number, default: 0 },
      rewardedSlots: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound / Nested Indexes
userSchema.index({ 'refreshTokens.tokenHash': 1 });

/**
 * Pre-save hook: Hashes password before storing in database.
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // Hash password with cost factor of 12
  this.password = await bcrypt.hash(this.password, 12);

  // If password was changed on existing user, update passwordChangedAt
  if (!this.isNew) {
    // 1 second in past allows JWT created immediately after to be valid
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

/**
 * Verifies if candidate password matches stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if user changed password after a JWT was issued.
 * @param {number} JWTTimestamp - Token issuance timestamp in seconds
 * @returns {boolean}
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Generates an email verification token, hashes it, and stores the hash on the document.
 * @returns {string} Unhashed random token to be emailed to user
 */
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return rawToken;
};

/**
 * Generates a password reset token, hashes it, and stores the hash on the document.
 * @returns {string} Unhashed random token to be emailed to user
 */
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 15 minutes
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return rawToken;
};

/**
 * Checks if the account is currently locked due to failed login attempts.
 * @returns {boolean}
 */
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

/**
 * Increments failed login count and locks account for 15 minutes if threshold (5) reached.
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // If a previous lock has expired, restart attempt count at 1
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    return await this.save({ validateBeforeSave: false });
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  // Lock account for 15 minutes upon reaching 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  return await this.save({ validateBeforeSave: false });
};

/**
 * Resets failed login attempts counter and unlocks account.
 */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.failedLoginAttempts === 0 && !this.lockUntil) return this;
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  return await this.save({ validateBeforeSave: false });
};

export const User = mongoose.model('User', userSchema);
export default User;
