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
    const identifier = req.params.username || req.params.id;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Developer identifier required' });
    }

    let user = null;

    // 1. Check if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findOne({
        _id: identifier,
        accountStatus: 'ACTIVE',
      }).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    }

    // 2. Check by exact username
    if (!user) {
      user = await User.findOne({
        username: identifier.toLowerCase(),
        accountStatus: 'ACTIVE',
      }).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    }

    // 3. Fallback: search by name or slugified name
    if (!user) {
      const sanitized = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const unhyphenated = identifier.replace(/-/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        $or: [
          { name: new RegExp(`^${sanitized}$`, 'i') },
          { name: new RegExp(`^${unhyphenated}$`, 'i') },
        ],
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
