const mongoose = require('mongoose');

const aiGenerationConfigSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    unique: true,
    index: true
  },

  // OpenAI Settings
  openaiApiKey: {
    type: String,
    // In production, this should be encrypted
    default: ''
  },
  openaiModel: {
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
    default: 2000,
    min: 100,
    max: 4000
  },
  topP: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  frequencyPenalty: {
    type: Number,
    min: -2,
    max: 2,
    default: 0
  },
  presencePenalty: {
    type: Number,
    min: -2,
    max: 2,
    default: 0
  },

  // Generation Preferences
  defaultTone: {
    type: String,
    enum: ['professional', 'casual', 'academic', 'creative', 'technical'],
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

  // Content Guidelines
  brandVoice: String,
  contentGuidelines: String,
  prohibitedTopics: [String],
  requiredKeywords: [String],
  styleGuide: String,

  // Quality Settings
  enableSeoOptimization: {
    type: Boolean,
    default: true
  },
  enableToneCheck: {
    type: Boolean,
    default: true
  },
  minReadabilityScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  maxSimilarityThreshold: {
    type: Number,
    default: 85,
    min: 0,
    max: 100
  },

  // Usage & Quota
  monthlyTokenQuota: {
    type: Number,
    default: 100000
  },
  monthlyGenerationQuota: {
    type: Number,
    default: 100
  },
  apiUsageMonitored: {
    type: Boolean,
    default: true
  },

  // Cost Tracking
  costPerToken: Number,
  costPerGeneration: Number,

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: mongoose.Schema.Types.ObjectId
});

aiGenerationConfigSchema.index({ clientId: 1, isActive: 1 });

module.exports = mongoose.model('AIGenerationConfig', aiGenerationConfigSchema);
