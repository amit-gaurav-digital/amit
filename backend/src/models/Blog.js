const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'en'
  },
  metadata: {
    seoTitle: String,
    seoDescription: String,
    canonicalUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date
});

blogSchema.index({ createdBy: 1, status: 1 });
blogSchema.index({ slug: 1 });
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
