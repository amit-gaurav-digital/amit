const mongoose = require('mongoose');

const aiGenerationRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    index: true
  },

  // Generation Request Details
  generationType: {
    type: String,
    enum: [
      'outline_only',
      'full_content',
      'title_generation',
      'excerpt_generation',
      'refinement',
      'rewrite',
      'seo_optimization',
      'variant_generation'
    ],
    required: true
  },

  // Input Parameters
  topic: String,
  keywords: [String],
  targetAudience: String,
  tone: {
    type: String,
    enum: ['professional', 'casual', 'academic', 'creative', 'technical']
  },
  length: {
    type: String,
    enum: ['short', 'medium', 'long']
  },
  language: {
    type: String,
    default: 'en'
  },
  contentType: {
    type: String,
    enum: ['blog_post', 'guide', 'tutorial', 'news', 'analysis', 'how_to']
  },
  additionalInstructions: String,
  sourceContent: String,
  variantCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },

  // Generation Output
  generatedContent: {
    title: String,
    excerpt: String,
    content: String,
    outline: [String],
    keywords: [String],
    readabilityScore: Number,
    seoScore: Number,
    wordCount: Number,
    estimatedReadTime: Number
  },

  // Multiple Variants
  variants: [{
    variantId: mongoose.Schema.Types.ObjectId,
    title: String,
    excerpt: String,
    content: String,
    seoScore: Number,
    readabilityScore: Number,
    selectedAt: Date
  }],

  // Generation Metadata
  promptTemplate: String,
  model: String,
  tokensUsed: {
    type: Number,
    default: 0
  },
  costUsd: {
    type: Number,
    default: 0
  },
  generationTime: Number,

  // Quality Metrics
  plagiarismScore: {
    type: Number,
    min: 0,
    max: 100
  },
  readabilityMetrics: {
    flesch_reading_ease: Number,
    flesch_kincaid_grade: Number,
    gunning_fog_index: Number,
    automated_readability_index: Number
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,

  // Action Taken
  action: {
    type: String,
    enum: ['saved_to_draft', 'saved_to_blog', 'discarded', 'regenerated']
  },
  savedToBlogId: mongoose.Schema.Types.ObjectId,
  discardedAt: Date,
  discardReason: String,

  // Feedback
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    suggestedImprovements: String,
    ratedAt: Date
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: Date
});

// TTL index - auto-delete after 90 days
aiGenerationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for queries
aiGenerationRequestSchema.index({ clientId: 1, userId: 1, createdAt: -1 });
aiGenerationRequestSchema.index({ clientId: 1, generationType: 1, status: 1 });

module.exports = mongoose.model('AIGenerationRequest', aiGenerationRequestSchema);
