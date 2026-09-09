import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import DeveloperProfile from '../models/DeveloperProfile.js';

/**
 * @desc    Get authenticated developer profile
 * @route   GET /api/developer/profile
 * @access  Private (DEVELOPER role)
 */
export const getDeveloperProfile = asyncHandler(async (req, res, next) => {
  let profile = await DeveloperProfile.findOne({ userId: req.user._id });

  // Self-heal profile if missing for a user with DEVELOPER role
  if (!profile) {
    profile = await DeveloperProfile.create({
      userId: req.user._id,
      developerStatus: 'ACTIVE',
      verificationStatus: 'UNVERIFIED',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Developer profile retrieved successfully.',
    data: {
      profile,
    },
  });
});

/**
 * @desc    Update authenticated developer profile
 * @route   PATCH /api/developer/profile
 * @access  Private (DEVELOPER role)
 */
export const updateDeveloperProfile = asyncHandler(async (req, res, next) => {
  // Only permitted developer fields
  const allowedFields = ['companyName', 'website', 'githubProfile', 'portfolioUrl', 'developerBio'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const profile = await DeveloperProfile.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: 'Developer profile updated successfully.',
    data: {
      profile,
    },
  });
});

export default {
  getDeveloperProfile,
  updateDeveloperProfile,
};
