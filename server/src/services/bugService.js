import BugReport from '../models/BugReport.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/pagination.js';

export class BugService {
  /**
   * Submits a new structured bug report
   */
  static async submitBugReport({
    user = null,
    reporterName = '',
    reporterEmail = '',
    reporterRole = 'USER',
    title = '',
    description = '',
    stepsToReproduce = '',
    expectedResult = '',
    actualResult = '',
    severity = 'MEDIUM',
    application = null,
    deviceInfo = {},
    screenshots = [],
  }) {
    if (!title || !description) {
      const err = new Error('Bug title and description are required');
      err.statusCode = 400;
      throw err;
    }

    let finalName = reporterName;
    let finalEmail = reporterEmail;
    let finalRole = reporterRole;

    if (user) {
      finalName = user.name || reporterName || 'Beta Tester';
      finalEmail = user.email || reporterEmail;
      finalRole = user.role || reporterRole;
    }

    const bugReport = await BugReport.create({
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim(),
      expectedResult: expectedResult.trim(),
      actualResult: actualResult.trim(),
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity) ? severity : 'MEDIUM',
      reporter: user?._id || null,
      reporterName: finalName || 'Anonymous Tester',
      reporterEmail: finalEmail || '',
      reporterRole: finalRole || 'USER',
      application: application || null,
      deviceInfo,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      status: 'OPEN',
    });

    return bugReport;
  }

  /**
   * Queries bug reports with filtering and pagination
   */
  static async getBugReports(query = {}) {
    const { page, limit, skip } = getPaginationParams(query, 10, 100);
    const filter = {};

    if (query.severity && query.severity !== 'ALL') {
      filter.severity = query.severity;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.application) {
      filter.application = query.application;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { bugId: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { reporterEmail: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      BugReport.find(filter)
        .populate('reporter', 'name email role')
        .populate('application', 'name slug icon')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BugReport.countDocuments(filter),
    ]);

    return formatPaginationResponse({ data, total, page, limit });
  }

  /**
   * Updates bug report status, severity, or admin notes
   */
  static async updateBugReport(bugId, { status, severity, adminNotes, adminUser = null }) {
    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updates.resolvedAt = new Date();
        if (adminUser) updates.resolvedBy = adminUser._id;
      }
    }
    if (severity) updates.severity = severity;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const bug = await BugReport.findByIdAndUpdate(bugId, updates, { new: true })
      .populate('reporter', 'name email role')
      .populate('application', 'name slug');

    if (!bug) {
      const err = new Error('Bug report not found');
      err.statusCode = 404;
      throw err;
    }

    return bug;
  }
}

export default BugService;
