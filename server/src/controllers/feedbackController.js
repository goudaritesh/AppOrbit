import FeedbackService from '../services/feedbackService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const submitFeedback = asyncHandler(async (req, res) => {
  const { name, email, role, type, category, rating, message } = req.body;

  const feedback = await FeedbackService.submitFeedback({
    user: req.user || null,
    name,
    email,
    role: req.user?.role || role,
    type,
    category,
    rating,
    message,
  });

  return sendSuccess(res, 'Feedback submitted successfully. Thank you for helping shape AppOrbit Beta!', feedback, 201);
});

export const getAdminFeedbacks = asyncHandler(async (req, res) => {
  const result = await FeedbackService.getFeedbacks(req.query);
  return sendSuccess(res, 'Feedback retrieved successfully', result);
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feedback = await FeedbackService.updateFeedbackStatus(id, req.body);
  return sendSuccess(res, 'Feedback status updated successfully', feedback);
});

export const upvoteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feedback = await FeedbackService.upvoteFeedback(id);
  return sendSuccess(res, 'Feedback upvoted', feedback);
});

export default {
  submitFeedback,
  getAdminFeedbacks,
  updateFeedback,
  upvoteFeedback,
};
