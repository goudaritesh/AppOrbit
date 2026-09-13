import crypto from 'crypto';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import App from '../models/App.js';

export class ReferralService {
  /**
   * Generates or retrieves the unique referral code and shareable links for a user
   */
  static async getOrCreateReferralCode(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (!user.referralCode) {
      // Generate clean alphanumeric code: AO-XXXXXX
      const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user.referralCode = `AO-${rawCode}`;
      await user.save();
    }

    const shareUrl = `/invite/${user.referralCode}`;

    return {
      referralCode: user.referralCode,
      shareUrl,
      referralStats: user.referralStats || { totalReferred: 0, activatedDevelopers: 0, rewardedSlots: 0 },
    };
  }

  /**
   * Fetches full referral telemetry and referee history for current user
   */
  static async getMyReferrals(userId) {
    const codeData = await this.getOrCreateReferralCode(userId);

    const referrals = await Referral.find({ referrer: userId })
      .populate('referee', 'name email role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...codeData,
      referrals,
    };
  }

  /**
   * Validates an invite/referral code during onboarding
   */
  static async validateInviteCode(code) {
    if (!code) {
      return { valid: false, message: 'Invite code is required' };
    }

    const cleanCode = code.trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: cleanCode }).select('name role referralCode');

    if (!referrer) {
      return { valid: false, message: 'Invalid or expired invite code' };
    }

    return {
      valid: true,
      referrerName: referrer.name,
      referrerRole: referrer.role,
      code: referrer.referralCode,
      message: `Invited by ${referrer.name}`,
    };
  }

  /**
   * Records a new referral conversion when referee registers
   */
  static async processReferralRegistration(refereeUser, referralCode) {
    if (!referralCode) return null;

    const cleanCode = referralCode.trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer || referrer._id.toString() === refereeUser._id.toString()) {
      return null;
    }

    // Check if referral already exists
    const existingReferral = await Referral.findOne({ referrer: referrer._id, referee: refereeUser._id });
    if (existingReferral) return existingReferral;

    const referral = await Referral.create({
      referrer: referrer._id,
      referralCode: cleanCode,
      referee: refereeUser._id,
      refereeEmail: refereeUser.email,
      refereeRole: refereeUser.role,
      status: 'REGISTERED',
    });

    // Update referee user
    refereeUser.referredBy = referrer._id;
    await refereeUser.save();

    // Increment referrer stats
    if (!referrer.referralStats) {
      referrer.referralStats = { totalReferred: 0, activatedDevelopers: 0, rewardedSlots: 0 };
    }
    referrer.referralStats.totalReferred += 1;
    await referrer.save();

    return referral;
  }

  /**
   * Triggered when a developer publishes their first application
   * Awards the referrer with extra slots/perks
   */
  static async processFirstAppActivation(developerId) {
    const referral = await Referral.findOne({ referee: developerId, status: 'REGISTERED' });
    if (!referral) return null;

    referral.status = 'ACTIVATED_FIRST_APP';
    referral.activatedAt = new Date();
    await referral.save();

    // Reward referrer
    const referrer = await User.findById(referral.referrer);
    if (referrer) {
      if (!referrer.referralStats) {
        referrer.referralStats = { totalReferred: 0, activatedDevelopers: 0, rewardedSlots: 0 };
      }
      referrer.referralStats.activatedDevelopers += 1;
      referrer.referralStats.rewardedSlots += 1;
      await referrer.save();
    }

    return referral;
  }

  /**
   * Admin telemetry: Query all platform referrals
   */
  static async getAdminReferrals({ page = 1, limit = 50, status, search }) {
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Referral.find(query)
        .populate('referrer', 'name email role referralCode')
        .populate('referee', 'name email role createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Referral.countDocuments(query),
    ]);

    const totalConversions = await Referral.countDocuments({ status: { $in: ['ACTIVATED_FIRST_APP', 'REWARDED'] } });

    return {
      items,
      totalConversions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }
}

export default ReferralService;
