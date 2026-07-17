const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  website: {
    type: String,
    default: null
  },
  logo: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  industryType: {
    type: String,
    enum: ['Technology', 'Marketing', 'E-commerce', 'SaaS', 'Other'],
    default: 'Other'
  },
  subscriptionPlan: {
    type: String,
    enum: ['Basic', 'Pro', 'Enterprise'],
    default: 'Basic'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'paused'],
    default: 'active'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  apiKeys: [{
    key: String,
    name: String,
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  },
  customBranding: {
    primaryColor: { type: String, default: '#1E40AF' },
    secondaryColor: { type: String, default: '#F97316' },
    fontFamily: { type: String, default: 'inter' }
  },
  totalBlogs: {
    type: Number,
    default: 0
  },
  publishedBlogs: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    notes: String,
    tags: [String]
  },
  // AI Generation Configuration
  aiGeneration: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    openaiApiKey: {
      type: String,
      default: null
    },
    preferredModel: {
      type: String,
      enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 2000
    }
  },
  // AI Content Preferences
  aiContentDefaults: {
    defaultTone: {
      type: String,
      enum: ['professional', 'casual', 'academic', 'conversational', 'formal'],
      default: 'professional'
    },
    defaultLanguage: {
      type: String,
      default: 'en'
    },
    defaultLength: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    },
    brandVoice: String,
    targetAudience: String,
    prohibitedTopics: [String],
    requiredKeywords: [String]
  },
  // AI Quality Guidelines
  aiQualitySettings: {
    minReadabilityScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    },
    maxSimilarityThreshold: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    },
    requiresApprovalForAI: {
      type: Boolean,
      default: true
    }
  },
  // AI Quota Management
  aiQuota: {
    monthlyTokenLimit: {
      type: Number,
      default: 100000
    },
    monthlyGenerationLimit: {
      type: Number,
      default: 100
    },
    monthlyCostLimit: {
      type: Number,
      default: 500
    },
    tokensUsedThisMonth: {
      type: Number,
      default: 0
    },
    generationsUsedThisMonth: {
      type: Number,
      default: 0
    },
    costThisMonth: {
      type: Number,
      default: 0
    },
    quotaResetDate: Date,
    quotaAlerts: {
      enableAlerts: {
        type: Boolean,
        default: true
      },
      alertThresholds: {
        tokens: {
          type: [Number],
          default: [80, 95, 100]
        },
        generations: {
          type: [Number],
          default: [80, 95, 100]
        },
        cost: {
          type: [Number],
          default: [80, 95, 100]
        }
      }
    }
  }
}, { timestamps: true });

clientSchema.index({ email: 1 });
clientSchema.index({ subscriptionStatus: 1 });
clientSchema.index({ isActive: 1 });
clientSchema.index({ 'aiGeneration.isEnabled': 1 });

module.exports = mongoose.model('Client', clientSchema);
