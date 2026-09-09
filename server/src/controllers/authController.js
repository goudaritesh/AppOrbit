import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import DeveloperProfile from '../models/DeveloperProfile.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sanitizeUser,
} from '../utils/tokenUtils.js';
import emailService from '../services/emailService.js';

/**
 * @desc    Register a new User or Developer
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // 1. Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 400));
  }

  // 2. Validate normalized role (only USER and DEVELOPER allowed)
  const normalizedRole = role ? role.toUpperCase() : 'USER';
  if (['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole)) {
    return next(
      new AppError('Public registration for administrative roles is strictly prohibited.', 400)
    );
  }

  if (!['USER', 'DEVELOPER'].includes(normalizedRole)) {
    return next(new AppError('Role must be either USER or DEVELOPER.', 400));
  }

  // 3. Instantiate user document
  const user = new User({
    name,
    email: email.toLowerCase(),
    password,
    role: normalizedRole,
    accountStatus: 'PENDING_VERIFICATION',
    emailVerified: false,
  });

  // 4. Generate email verification token
  const rawVerificationToken = user.createEmailVerificationToken();

  // 5. Save user to database
  await user.save();

  // 6. If role is DEVELOPER, create associated DeveloperProfile
  if (normalizedRole === 'DEVELOPER') {
    try {
      await DeveloperProfile.create({
        userId: user._id,
        developerStatus: 'ACTIVE',
        verificationStatus: 'UNVERIFIED',
      });
    } catch (profileErr) {
      // Rollback user if developer profile creation fails
      await User.findByIdAndDelete(user._id);
      return next(new AppError('Failed to initialize developer profile. Please try again.', 500));
    }
  }

  // 7. Dispatch verification email
  await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawVerificationToken,
  });

  // 8. Return safe user response
  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please verify your email address to continue.',
    data: {
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Authenticate user & issue JWT + HttpOnly refresh cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  }

  // 1. Find user by email and explicitly select password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // 2. Check account status
  if (user.accountStatus === 'SUSPENDED') {
    return next(
      new AppError(
        'Your account has been temporarily suspended. Please contact AppOrbit support.',
        403
      )
    );
  }

  if (user.accountStatus === 'BANNED') {
    return next(
      new AppError(
        'Your account has been permanently banned from the platform for policy violations.',
        403
      )
    );
  }

  // 3. Enforce email verification before full access
  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in.',
      emailVerified: false,
      email: user.email,
    });
  }

  // 4. Generate Access & Refresh tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 5. Hash refresh token and store in user's active refreshTokens list (keep latest 5)
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Trim old/expired tokens
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // 6. Set secure HttpOnly cookie
  setRefreshTokenCookie(res, refreshToken);

  // 7. Send success response with access token and user info
  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      accessToken,
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Revoke refresh token and clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    // Remove token from database
    await User.updateOne(
      { 'refreshTokens.tokenHash': tokenHash },
      { $pull: { refreshTokens: { tokenHash } } }
    );
  }

  // Clear cookie
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * @desc    Rotate refresh token and issue new access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (via HttpOnly cookie)
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    return next(new AppError('No refresh token provided. Please log in.', 401));
  }

  // 1. Verify token signature
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    clearRefreshTokenCookie(res);
    return next(new AppError('Refresh token expired or invalid. Please log in again.', 401));
  }

  // 2. Hash incoming token and find user with matching active session
  const incomingHash = hashToken(incomingToken);
  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.tokenHash': incomingHash,
  });

  if (!user) {
    clearRefreshTokenCookie(res);
    return next(new AppError('Refresh token has been revoked or is invalid.', 401));
  }

  // 3. Verify user status
  if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
    clearRefreshTokenCookie(res);
    return next(new AppError('Account is not active.', 403));
  }

  // 4. Token Rotation: generate new access & refresh tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Remove old token hash and add new token hash
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== incomingHash);
  user.refreshTokens.push({
    tokenHash: newHash,
    expiresAt,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  });

  await user.save({ validateBeforeSave: false });

  // 5. Update HttpOnly cookie with new refresh token
  setRefreshTokenCookie(res, newRefreshToken);

  // 6. Return new access token and user
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully.',
    data: {
      accessToken: newAccessToken,
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email address.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // If user exists, generate reset token and dispatch email
  if (user) {
    const rawResetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawResetToken,
    });
  }

  // Always return identical generic message to prevent email enumeration
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email address, password reset instructions have been sent.',
  });
});

/**
 * @desc    Reset password using reset token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new AppError('Token and new password are required.', 400));
  }

  // 1. Hash incoming token and find user with active non-expired reset token
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired.', 400));
  }

  // 2. Update password and invalidate all active refresh sessions
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Revoke active sessions across devices

  await user.save();

  // 3. Clear cookie if present
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Password successfully updated. You may now log in with your new password.',
  });
});

/**
 * @desc    Verify email address using verification token
 * @route   GET /api/auth/verify-email/:token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.body.token || req.query.token;

  if (!token) {
    return next(new AppError('Verification token is required.', 400));
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError(
        'Verification token is invalid or has expired. Please request a new verification email.',
        400
      )
    );
  }

  user.emailVerified = true;
  user.accountStatus = 'ACTIVE';
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email address successfully verified! Your account is now active.',
    data: {
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Resend email verification token
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(async (req, res, next) => {
  const email = req.body.email || req.user?.email;

  if (!email) {
    return next(new AppError('Please provide an email address.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an unverified account exists with this email, a new verification link has been sent.',
    });
  }

  if (user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: 'This account has already been verified. You may log in directly.',
    });
  }

  const rawVerificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawVerificationToken,
  });

  res.status(200).json({
    success: true,
    message: 'If an unverified account exists with this email, a new verification link has been sent.',
  });
});

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (Bearer token)
 */
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully.',
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

/**
 * @desc    Update authenticated user's profile
 * @route   PATCH /api/auth/profile
 * @access  Private (Bearer token)
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  // Only allow updating safe profile fields
  const allowedFields = ['name', 'bio', 'phoneNumber', 'githubUrl', 'portfolioUrl', 'profileImage'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: sanitizeUser(updatedUser),
    },
  });
});

export default {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
};
