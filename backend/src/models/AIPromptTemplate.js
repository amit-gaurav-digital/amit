const mongoose = require('mongoose');

const aiPromptTemplateSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    index: true
  },

  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['blog_post', 'guide', 'tutorial', 'news', 'product_review', 'analysis', 'how_to'],
    default: 'blog_post'
  },

  // Prompt Template
  systemPrompt: {
    type: String,
    required: true
  },
  userPromptTemplate: {
    type: String,
    required: true
  },

  // Template Variables
  variables: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'array'],
      default: 'text'
    },
    required: Boolean,
    defaultValue: String,
    options: [String]
  }],

  // Generated Examples
  examples: [{
    input: mongoose.Schema.Types.Mixed,
    output: String,
    quality: {
      type: Number,
      min: 1,
      max: 5
    }
  }],

  // Performance Metrics
  averageTokens: Number,
  averageQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },

  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
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
  createdBy: mongoose.Schema.Types.ObjectId
});

aiPromptTemplateSchema.index({ clientId: 1, isActive: 1 });
aiPromptTemplateSchema.index({ category: 1, isDefault: 1 });

module.exports = mongoose.model('AIPromptTemplate', aiPromptTemplateSchema);
