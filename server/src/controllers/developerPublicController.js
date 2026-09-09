import mongoose from 'mongoose';
import User from '../models/User.js';
import DeveloperProfile from '../models/DeveloperProfile.js';
import App from '../models/App.js';
import { serializePublicDeveloper } from '../utils/serializers.js';

/**
 * @desc    Get public developer profile and published applications
 * @route   GET /api/developers/:id
 * @access  Public
 */
export const getPublicDeveloperProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    let user = null;

    // Check if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findOne({
        _id: id,
        accountStatus: 'ACTIVE',
      }).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    }

    // Fallback: search by exact name if not ObjectId
    if (!user) {
      user = await User.findOne({
        name: new RegExp(`^${id}$`, 'i'),
        accountStatus: 'ACTIVE',
      }).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Developer profile not found',
      });
    }

    // Fetch associated developer profile
    const profile = await DeveloperProfile.findOne({ userId: user._id });

    // Fetch published applications authored by this developer
    const apps = await App.find({
      developer: user._id,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .populate('developer', 'name profileImage bio githubUrl portfolioUrl verificationStatus')
      .populate('category', 'name slug icon')
      .sort({ downloadCount: -1, ratingAverage: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Developer profile retrieved successfully',
      data: {
        developer: serializePublicDeveloper(user, profile, apps),
      },
    });
  } catch (error) {
    next(error);
  }
};
