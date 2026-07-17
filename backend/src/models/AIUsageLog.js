const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIGenerationRequest'
  },

  // Usage Details
  action: {
    type: String,
    enum: ['generate', 'refine', 'regenerate', 'discard', 'save'],
    required: true
  },
  generationType: String,
  tokensUsed: {
    type: Number,
    default: 0
  },
  costUsd: {
    type: Number,
    default: 0
  },
  model: String,

  // Quota Tracking
  monthlyTokensUsed: Number,
  monthlyTokensRemaining: Number,
  monthlyGenerationsUsed: Number,
  monthlyGenerationsRemaining: Number,
  quotaExceeded: {
    type: Boolean,
    default: false
  },

  // Date Tracking
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  billingMonth: String // YYYY-MM format
});

// Indexes for efficient querying
aiUsageLogSchema.index({ clientId: 1, createdAt: -1 });
aiUsageLogSchema.index({ clientId: 1, billingMonth: 1 });
aiUsageLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
