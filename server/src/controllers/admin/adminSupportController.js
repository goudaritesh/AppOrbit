import { SupportTicket } from '../../models/SupportTicket.js';
import { SupportMessage } from '../../models/SupportMessage.js';
import { AuditLogService } from '../../services/admin/auditLogService.js';

/**
 * Admin Support Management Controller (Phase 7 Production Implementation)
 * Help desk, ticket prioritization, threaded agent replies, and resolution lifecycle.
 */

/**
 * GET /api/admin/support
 * Query support tickets with pagination, status, priority, and category filters
 */
export const getSupportTickets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, priority, category, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ ticketNumber: regex }, { subject: regex }];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('createdBy', 'name email profileImage role')
        .populate('assignedTo', 'name email')
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/support/:ticketId
 * Detailed view of ticket including threaded message history
 */
export const getSupportTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate('createdBy', 'name email profileImage role')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    const messages = await SupportMessage.find({ ticket: ticket._id })
      .populate('sender', 'name email profileImage role')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/support/:ticketId/message
 * Add agent reply to ticket thread
 */
export const addTicketMessage = async (req, res, next) => {
  try {
    const { message, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
      attachments,
    });

    ticket.lastMessageAt = new Date();
    if (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') {
      ticket.status = 'WAITING_FOR_USER';
    }
    await ticket.save();

    return res.status(201).json({
      success: true,
      message: 'Support message sent.',
      data: { message: newMessage, ticketStatus: ticket.status },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/support/:ticketId/status
 * Update ticket lifecycle status or priority
 */
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    const previousState = { status: ticket.status, priority: ticket.priority };

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    await AuditLogService.log({
      req,
      action: 'SUPPORT_TICKET_STATUS_UPDATED',
      resourceType: 'SUPPORT',
      resourceId: ticket._id,
      previousState,
      newState: { status: ticket.status, priority: ticket.priority },
    });

    return res.status(200).json({
      success: true,
      message: 'Support ticket status updated.',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/support/:ticketId/assign
 * Assign support ticket to an administrative agent
 */
export const assignTicket = async (req, res, next) => {
  try {
    const { agentId } = req.body;

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found.' });
    }

    ticket.assignedTo = agentId || req.user._id;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully.',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getSupportTickets,
  getSupportTicketById,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
};
