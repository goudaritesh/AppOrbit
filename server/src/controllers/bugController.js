import BugService from '../services/bugService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const submitBug = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    stepsToReproduce,
    expectedResult,
    actualResult,
    severity,
    application,
    deviceInfo,
    screenshots,
    reporterName,
    reporterEmail,
    reporterRole,
  } = req.body;

  const bugReport = await BugService.submitBugReport({
    user: req.user || null,
    reporterName,
    reporterEmail,
    reporterRole: req.user?.role || reporterRole,
    title,
    description,
    stepsToReproduce,
    expectedResult,
    actualResult,
    severity,
    application,
    deviceInfo,
    screenshots,
  });

  return sendSuccess(res, 'Bug report submitted successfully. Our engineering team is reviewing it.', bugReport, 201);
});

export const getAdminBugs = asyncHandler(async (req, res) => {
  const result = await BugService.getBugReports(req.query);
  return sendSuccess(res, 'Bug reports retrieved successfully', result);
});

export const updateBug = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, severity, adminNotes } = req.body;

  const bug = await BugService.updateBugReport(id, {
    status,
    severity,
    adminNotes,
    adminUser: req.user,
  });

  return sendSuccess(res, 'Bug report updated successfully', bug);
});

export default {
  submitBug,
  getAdminBugs,
  updateBug,
};
