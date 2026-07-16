const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'canceled', 'expired', 'past_due'],
    default: 'active'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  canceledAt: Date,
  cancelReason: String,
  autoRenew: {
    type: Boolean,
    default: true
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'none'],
    default: 'credit_card'
  },
  cardLastFour: String,
  cardBrand: String,
  cardExpiry: String,
  usageStats: {
    blogsCreatedThisMonth: {
      type: Number,
      default: 0
    },
    translationsThisMonth: {
      type: Number,
      default: 0
    },
    storageUsedGB: {
      type: Number,
      default: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0
    },
    socialPostsThisMonth: {
      type: Number,
      default: 0
    }
  },
  upgradedAt: Date,
  downgradedAt: Date,
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

userSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });
userSubscriptionSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
