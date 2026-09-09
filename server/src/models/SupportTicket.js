import mongoose from 'mongoose';

/**
 * Support Ticket Model (Phase 7 Production Implementation)
 * Manages developer and consumer inquiries, technical issues, and billing requests.
 */
const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['USER', 'DEVELOPER'],
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: [
        'TECHNICAL',
        'PAYMENT',
        'ACCOUNT',
        'APPLICATION',
        'APK_UPLOAD',
        'SECURITY',
        'SUBSCRIPTION',
        'OTHER',
      ],
      default: 'GENERAL',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
