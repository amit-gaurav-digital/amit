const mongoose = require('mongoose');

const blogLanguageSchema = new mongoose.Schema({
  originalBlogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'nl', 'pl', 'tr'],
    index: true
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    default: null
  },
  keywords: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  translatedFrom: {
    language: String,
    blogId: mongoose.Schema.Types.ObjectId,
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  translationMetadata: {
    translatorType: {
      type: String,
      enum: ['openai', 'google-translate', 'manual'],
      default: 'openai'
    },
    translatedAt: Date,
    translatedBy: mongoose.Schema.Types.ObjectId,
    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  seoOptimization: {
    keywordDensity: Number,
    readabilityScore: Number,
    estimatedReadTime: Number
  },
  publishedAt: {
    type: Date,
    default: null
  },
  viewCount: {
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
  }
}, { timestamps: true });

blogLanguageSchema.index({ originalBlogId: 1, language: 1 }, { unique: true });
blogLanguageSchema.index({ slug: 1 });
blogLanguageSchema.index({ language: 1 });
blogLanguageSchema.index({ status: 1 });
blogLanguageSchema.index({ publishedAt: -1 });

blogLanguageSchema.methods.markAsReviewed = function(reviewedBy) {
  this.translationMetadata.isReviewed = true;
  this.translationMetadata.reviewedBy = reviewedBy;
  this.translationMetadata.reviewedAt = new Date();
  return this;
};

blogLanguageSchema.statics.getAvailableLanguages = function() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' }
  ];
};

module.exports = mongoose.model('BlogLanguage', blogLanguageSchema);
