import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generates a short-lived access token containing minimal user identity.
 * @param {object} user - User document or object with _id and role
 * @returns {string} JWT Access Token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    }
  );
};

/**
 * Generates a long-lived refresh token signed with dedicated refresh secret.
 * @param {object} user - User document or object with _id
 * @returns {string} JWT Refresh Token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Verifies a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifies a JWT refresh token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

/**
 * Hashes a token using SHA-256 for secure database storage.
 * @param {string} rawToken
 * @returns {string} SHA-256 hash
 */
export const hashToken = (rawToken) => {
  if (!rawToken) return '';
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Sets the Refresh Token as a secure HttpOnly cookie on the response.
 * @param {object} res - Express response
 * @param {string} token - Raw refresh token string
 */
export const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/', // Accessible for refresh endpoint
  };

  res.cookie('refreshToken', token, cookieOptions);
};

/**
 * Clears the Refresh Token cookie on logout or invalidation.
 * @param {object} res - Express response
 */
export const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

/**
 * Strips password hashes, internal security tokens, and returns a safe User DTO.
 * @param {object} user - User document or object
 * @returns {object} Sanitized user data
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };

  delete obj.password;
  delete obj.refreshTokens;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.__v;

  return {
    id: obj._id ? obj._id.toString() : obj.id,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    accountStatus: obj.accountStatus,
    emailVerified: obj.emailVerified,
    profileImage: obj.profileImage || '',
    bio: obj.bio || '',
    phoneNumber: obj.phoneNumber || '',
    githubUrl: obj.githubUrl || '',
    portfolioUrl: obj.portfolioUrl || '',
    lastLogin: obj.lastLogin,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sanitizeUser,
};
