const mongoose = require('mongoose');

const aiBlogVariantSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  generationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIGenerationRequest'
  },

  // Variant Details
  variantType: {
    type: String,
    enum: ['original', 'tone_variation', 'length_variation', 'seo_variant', 'audience_variant'],
    default: 'original'
  },

  content: {
    title: String,
    excerpt: String,
    content: String,
    tone: String,
    length: String,
    keywords: [String]
  },

  // Quality Metrics
  metrics: {
    seoScore: {
      type: Number,
      min: 0,
      max: 100
    },
    readabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    engagement: Number,
    wordCount: Number,
    plagiarismScore: Number
  },

  // A/B Testing
  isSelected: {
    type: Boolean,
    default: false
  },
  selectedAt: Date,
  selectedBy: mongoose.Schema.Types.ObjectId,

  // Performance (after publish)
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  engagementScore: Number,

  // Metadata
  testName: String,
  compareWith: mongoose.Schema.Types.ObjectId, // Reference to another variant for A/B testing

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
aiBlogVariantSchema.index({ blogId: 1, variantType: 1 });
aiBlogVariantSchema.index({ clientId: 1, isSelected: 1 });
aiBlogVariantSchema.index({ blogId: 1, isSelected: 1 });
aiBlogVariantSchema.index({ published: 1, createdAt: -1 });

module.exports = mongoose.model('AIBlogVariant', aiBlogVariantSchema);
