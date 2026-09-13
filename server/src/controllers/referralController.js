import ReferralService from '../services/referralService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getMyReferralCode = asyncHandler(async (req, res) => {
  const data = await ReferralService.getOrCreateReferralCode(req.user._id);
  return sendSuccess(res, 'Referral code retrieved successfully', data);
});

export const getMyReferrals = asyncHandler(async (req, res) => {
  const data = await ReferralService.getMyReferrals(req.user._id);
  return sendSuccess(res, 'Referral telemetry and history retrieved', data);
});

export const validateInviteCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const result = await ReferralService.validateInviteCode(code);
  return sendSuccess(res, result.message, result);
});

export const getAdminReferrals = asyncHandler(async (req, res) => {
  const data = await ReferralService.getAdminReferrals(req.query);
  return sendSuccess(res, 'Platform referral operations data retrieved', data);
});

export default {
  getMyReferralCode,
  getMyReferrals,
  validateInviteCode,
  getAdminReferrals,
};
