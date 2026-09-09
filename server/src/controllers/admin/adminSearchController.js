import { App } from '../../models/App.js';
import { User } from '../../models/User.js';
import { SupportTicket } from '../../models/SupportTicket.js';

/**
 * Global Admin Search Controller (Phase 7 Production Implementation)
 * Multi-entity fast search across applications, developers, users, and support tickets.
 */

/**
 * GET /api/admin/search
 * Query entities matching search keyword (?q=...)
 */
export const globalAdminSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          query: q,
          apps: [],
          developers: [],
          users: [],
          tickets: [],
        },
      });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [apps, developers, users, tickets] = await Promise.all([
      App.find({
        $or: [{ name: regex }, { slug: regex }, { packageName: regex }],
      })
        .select('name slug packageName icon status downloadCount')
        .limit(6),
      User.find({
        role: 'DEVELOPER',
        $or: [{ name: regex }, { email: regex }],
      })
        .select('name email profileImage accountStatus')
        .limit(6),
      User.find({
        role: 'USER',
        $or: [{ name: regex }, { email: regex }],
      })
        .select('name email profileImage accountStatus')
        .limit(6),
      SupportTicket.find({
        $or: [{ ticketNumber: regex }, { subject: regex }],
      })
        .select('ticketNumber subject priority status')
        .limit(6),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        query: q,
        apps,
        developers,
        users,
        tickets,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  globalAdminSearch,
};
