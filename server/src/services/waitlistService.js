import Waitlist from '../models/Waitlist.js';
import User from '../models/User.js';
import { sendWaitlistConfirmationEmail } from './emailService.js';

export class WaitlistService {
  /**
   * Join public beta / v1.0 waitlist
   */
  static async joinWaitlist({ name, email, role = 'USER', interests = [], referralCode = '', feedback = '' }) {
    const cleanEmail = email?.trim().toLowerCase();

    // Check if already registered user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const err = new Error('You already have an active AppOrbit account! You can access the platform directly.');
      err.statusCode = 400;
      throw err;
    }

    // Check if already in waitlist
    const existingEntry = await Waitlist.findOne({ email: cleanEmail });
    if (existingEntry) {
      return {
        entry: existingEntry,
        isExisting: true,
        message: 'You are already on the AppOrbit Launch Waitlist!',
      };
    }

    const newEntry = await Waitlist.create({
      name: name?.trim(),
      email: cleanEmail,
      role: ['DEVELOPER', 'USER', 'STUDENT', 'CREATOR'].includes(role) ? role : 'USER',
      interests: Array.isArray(interests) ? interests : [],
      referralCode: referralCode?.trim().toUpperCase(),
      feedback: feedback?.trim(),
      status: 'CONFIRMED',
    });

    // Fire confirmation email asynchronously — non-blocking
    sendWaitlistConfirmationEmail({
      to: cleanEmail,
      name: name?.trim() || 'Developer',
      role: newEntry.role,
    }).catch((err) => {
      console.error('[WaitlistService] Failed to send confirmation email:', err.message);
    });

    return {
      entry: newEntry,
      isExisting: false,
      message: 'Successfully reserved your spot on the AppOrbit Launch Waitlist!',
    };
  }

  /**
   * Admin query waitlist entries
   */
  static async getWaitlist({ page = 1, limit = 50, role, status, search }) {
    const query = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Waitlist.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Waitlist.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Get waitlist high-level summary
   */
  static async getWaitlistSummary() {
    const [total, developers, users, students] = await Promise.all([
      Waitlist.countDocuments(),
      Waitlist.countDocuments({ role: 'DEVELOPER' }),
      Waitlist.countDocuments({ role: 'USER' }),
      Waitlist.countDocuments({ role: 'STUDENT' }),
    ]);

    return {
      total,
      developers,
      users,
      students,
    };
  }
}

export default WaitlistService;
