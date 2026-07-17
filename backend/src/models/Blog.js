const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  excerpt: {
    type: String,
    trim: true
  },
  featuredImage: {
    type: String
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String
  },
  status: {
    type: String,
    enum: ['draft', 'in_review', 'scheduled', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  scheduledFor: Date,
  scheduledTimezone: {
    type: String,
    default: 'UTC'
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  versionHistory: [{
    versionNumber: Number,
    title: String,
    content: String,
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    savedAt: { type: Date, default: Date.now },
    changedFields: [String]
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    seoScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    engagement: {
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      likes: { type: Number, default: 0 }
    }
  },
  readTime: Number,
  wordCount: Number,
  language: {
    type: String,
    default: 'en'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date
}, { timestamps: true });

blogSchema.index({ clientId: 1, status: 1 });
blogSchema.index({ clientId: 1, createdAt: -1 });
blogSchema.index({ slug: 1, clientId: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1 });

blogSchema.virtual('isDeleted').get(function() {
  return this.deletedAt != null;
});

blogSchema.methods.calculateReadTime = function() {
  const wordsPerMinute = 200;
  this.wordCount = this.content.split(/\s+/).length;
  this.readTime = Math.ceil(this.wordCount / wordsPerMinute);
  return this.readTime;
};

blogSchema.methods.addVersion = function(updatedFields, changedFields, userId) {
  this.currentVersion += 1;
  const version = {
    versionNumber: this.currentVersion,
    title: this.title,
    content: this.content,
    savedBy: userId,
    savedAt: new Date(),
    changedFields: changedFields || []
  };
  this.versionHistory.push(version);
};

module.exports = mongoose.model('Blog', blogSchema);
