import BetaAnalyticsService from '../services/betaAnalyticsService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getBetaAnalytics = asyncHandler(async (req, res) => {
  const data = await BetaAnalyticsService.getBetaAnalytics();
  return sendSuccess(res, 'Beta platform analytics retrieved successfully', data);
});

export const getIncidents = asyncHandler(async (req, res) => {
  const incidents = await BetaAnalyticsService.getIncidents();
  return sendSuccess(res, 'Incidents retrieved successfully', incidents);
});

export const createIncident = asyncHandler(async (req, res) => {
  const incident = await BetaAnalyticsService.createIncident(req.body);
  return sendSuccess(res, 'Incident declared and recorded', incident, 201);
});

export const updateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const incident = await BetaAnalyticsService.updateIncident(id, {
    ...req.body,
    adminUser: req.user,
  });
  return sendSuccess(res, 'Incident updated successfully', incident);
});

export default {
  getBetaAnalytics,
  getIncidents,
  createIncident,
  updateIncident,
};
