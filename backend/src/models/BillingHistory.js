const mongoose = require('mongoose');

const billingHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true
  },
  invoiceType: {
    type: String,
    enum: ['subscription', 'upgrade', 'downgrade', 'refund', 'manual_adjustment'],
    default: 'subscription'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'canceled'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  description: String,
  periodStart: Date,
  periodEnd: Date,
  planName: String,
  billingCycle: String,
  stripeInvoiceId: String,
  stripePaymentIntentId: String,
  paidAt: Date,
  refundedAt: Date,
  refundAmount: Number,
  failureReason: String,
  failureCode: String,
  retryCount: {
    type: Number,
    default: 0
  },
  nextRetryAt: Date,
  receiptUrl: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

billingHistorySchema.index({ userId: 1, createdAt: -1 });
billingHistorySchema.index({ status: 1, createdAt: -1 });
billingHistorySchema.index({ stripeInvoiceId: 1 });
billingHistorySchema.index({ nextRetryAt: 1 });

module.exports = mongoose.model('BillingHistory', billingHistorySchema);
