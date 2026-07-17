const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  planType: {
    type: String,
    enum: ['Basic', 'Pro', 'Enterprise'],
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  features: {
    maxBlogs: Number,
    maxUsers: Number,
    aiGenerationLimit: Number,
    storageGB: Number,
    customDomain: Boolean,
    advancedAnalytics: Boolean,
    apiAccess: Boolean,
    multiChannelPublishing: Boolean
  },
  stripeCustomerId: String,
  stripePriceId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  autoRenew: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due'],
    default: 'active'
  },
  cancellationDate: Date,
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

subscriptionSchema.index({ clientId: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
