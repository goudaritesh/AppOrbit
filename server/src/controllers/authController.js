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
import { OAuth2Client } from 'google-auth-library';
import { admin } from '../config/firebaseAdmin.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Sprint 11: Brute-Force Account Protection Check
  if (user.isLocked()) {
    const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
    return res.status(423).json({
      success: false,
      code: 'ACCOUNT_LOCKED',
      message: `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: 'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
      });
    }
    const remainingAttempts = Math.max(0, 5 - (user.failedLoginAttempts || 0));
    return next(
      new AppError(
        `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before temporary account lock.`,
        401
      )
    );
  }

  // Reset failed login count upon successful password match
  await user.resetLoginAttempts();

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
 * @desc    Login or register via Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res, next) => {
  const { credential, role } = req.body;

  if (!credential) {
    return next(new AppError('Google authentication credential is required', 400));
  }

  // Verify Google token
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, sub: googleId, name, email_verified } = payload;

  if (!email_verified) {
    return next(new AppError('Your Google email address is not verified.', 403));
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.accountStatus === 'BANNED') {
      return next(new AppError('Your account has been permanently banned.', 403));
    }
    // Link google account if not already
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'GOOGLE';
      await user.save({ validateBeforeSave: false });
    }
  } else {
    // Register new user
    const normalizedRole = role ? role.toUpperCase() : 'USER';
    if (!['USER', 'DEVELOPER'].includes(normalizedRole)) {
      return next(new AppError('Role must be either USER or DEVELOPER.', 400));
    }

    user = new User({
      name,
      email: email.toLowerCase(),
      role: normalizedRole,
      accountStatus: 'ACTIVE',
      emailVerified: true,
      authProvider: 'GOOGLE',
      googleId,
    });
    await user.save({ validateBeforeSave: false }); // password is not required for Google

    if (normalizedRole === 'DEVELOPER') {
      try {
        await DeveloperProfile.create({ userId: user._id, verificationStatus: 'PENDING' });
      } catch (err) {
        // Log error but don't fail auth
        console.error('Failed to create DeveloperProfile:', err);
      }
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Google login successful.',
    data: {
      accessToken,
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Complete profile after Firebase Auth registration
 * @route   POST /api/auth/firebase-signup
 * @access  Public
 */
export const firebaseSignup = asyncHandler(async (req, res, next) => {
  const { idToken, name, role } = req.body;

  if (!idToken) return next(new AppError('Firebase ID token is required', 400));
  if (!name) return next(new AppError('Name is required to complete profile', 400));

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, sub: googleId, email_verified } = decodedToken;

  if (!email_verified) {
    return next(new AppError('Your email address is not verified by Firebase.', 403));
  }

  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return next(new AppError('Only valid @gmail.com accounts are permitted.', 403));
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    return next(new AppError('An account with this email already exists.', 400));
  }

  const normalizedRole = role ? role.toUpperCase() : 'USER';
  if (!['USER', 'DEVELOPER'].includes(normalizedRole)) {
    return next(new AppError('Role must be either USER or DEVELOPER.', 400));
  }

  user = new User({
    name,
    email: email.toLowerCase(),
    role: normalizedRole,
    accountStatus: 'ACTIVE',
    emailVerified: true,
    authProvider: 'GOOGLE', // Marking as Google since we enforced gmail
    googleId,
  });
  await user.save({ validateBeforeSave: false });

  if (normalizedRole === 'DEVELOPER') {
    try {
      await DeveloperProfile.create({ userId: user._id, verificationStatus: 'PENDING' });
    } catch (err) {
      console.error('Failed to create DeveloperProfile:', err);
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  
  user.refreshTokens = [{
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  }];
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: 'Profile completed successfully.',
    data: {
      accessToken,
      user: sanitizeUser(user),
    },
  });
});

/**
 * @desc    Login via Firebase Auth token
 * @route   POST /api/auth/firebase-login
 * @access  Public
 */
export const firebaseLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return next(new AppError('Firebase ID token is required', 400));

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, email_verified } = decodedToken;

  if (!email_verified) {
    return next(new AppError('Your email address is not verified by Firebase.', 403));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Return a specific 404 code so the frontend knows to redirect to /complete-profile
    return res.status(404).json({
      success: false,
      code: 'PROFILE_NOT_FOUND',
      message: 'Your AppOrbit profile is incomplete.',
    });
  }

  if (user.accountStatus === 'BANNED') {
    return next(new AppError('Your account has been permanently banned.', 403));
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);

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


/**
 * @desc    Upgrade User to Developer with a 1-Time Free Trial
 * @route   POST /api/auth/upgrade-trial
 * @access  Private (User only)
 */
export const upgradeToTrial = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'DEVELOPER') {
    return next(new AppError('You are already a developer.', 400));
  }

  if (user.freeTrialUsed) {
    return next(new AppError('You have already used your free trial. Please purchase a subscription.', 403));
  }

  // Upgrade role and mark trial as used
  user.role = 'DEVELOPER';
  user.freeTrialUsed = true;
  await user.save();

  // Create Developer Profile
  const existingProfile = await DeveloperProfile.findOne({ userId: user._id });
  if (!existingProfile) {
    await DeveloperProfile.create({
      userId: user._id,
      companyName: user.name || 'Developer',
      website: '',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Successfully upgraded to Developer! Welcome to your Free Trial.',
    data: {
      user: sanitizeUser(user),
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
  firebaseLogin,
  firebaseSignup,
  upgradeToTrial,
};
