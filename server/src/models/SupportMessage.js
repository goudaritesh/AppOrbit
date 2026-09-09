import mongoose from 'mongoose';

/**
 * Support Message Model (Phase 7 Production Implementation)
 * Thread conversation items for support tickets.
 */
const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['USER', 'DEVELOPER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'MODERATOR'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: 5000,
    },
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

supportMessageSchema.index({ ticket: 1, createdAt: 1 });

export const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
export default SupportMessage;
