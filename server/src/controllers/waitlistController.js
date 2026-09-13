import WaitlistService from '../services/waitlistService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const joinWaitlist = asyncHandler(async (req, res) => {
  const result = await WaitlistService.joinWaitlist(req.body);
  const status = result.isExisting ? 200 : 201;
  return sendSuccess(res, result.message, result.entry, status);
});

export const getWaitlist = asyncHandler(async (req, res) => {
  const data = await WaitlistService.getWaitlist(req.query);
  return sendSuccess(res, 'Waitlist retrieved successfully', data);
});

export const getWaitlistSummary = asyncHandler(async (req, res) => {
  const summary = await WaitlistService.getWaitlistSummary();
  return sendSuccess(res, 'Waitlist summary retrieved successfully', summary);
});

export default {
  joinWaitlist,
  getWaitlist,
  getWaitlistSummary,
};
