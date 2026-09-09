import mongoose from 'mongoose';

/**
 * Invoice Model (Phase 8 Production Implementation)
 * Enterprise invoicing with itemized charges, tax architecture, and lifecycle statuses.
 */
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'PAID', 'VOID', 'REFUNDED'],
      default: 'ISSUED',
      index: true,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    billingDetails: {
      name: String,
      email: String,
      company: String,
      taxId: String, // GST / VAT placeholder
      address: String,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ developer: 1, createdAt: -1 });

invoiceSchema.statics.generateInvoiceNumber = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments();
  const sequence = String(count + 1).padStart(6, '0');
  return `INV-${year}-${sequence}`;
};

export const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
