const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  tier: {
    type: Number,
    required: true,
    enum: [0, 1, 2]
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pricing: {
    monthlyPrice: {
      type: Number,
      default: 0
    },
    yearlyPrice: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  features: [
    {
      name: String,
      description: String,
      limit: Number,
      unlimited: {
        type: Boolean,
        default: false
      }
    }
  ],
  limits: {
    monthlyBlogs: {
      type: Number,
      default: -1
    },
    monthlyTranslations: {
      type: Number,
      default: -1
    },
    customDomains: {
      type: Number,
      default: -1
    },
    socialMediaAccounts: {
      type: Number,
      default: -1
    },
    storageGB: {
      type: Number,
      default: -1
    },
    teamMembers: {
      type: Number,
      default: -1
    },
    apiCallsPerMonth: {
      type: Number,
      default: -1
    }
  },
  benefits: [String],
  support: {
    type: String,
    enum: ['none', 'email', 'priority', 'dedicated'],
    default: 'email'
  },
  stripePriceIdMonthly: String,
  stripePriceIdYearly: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

subscriptionPlanSchema.index({ tier: 1 });
subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
