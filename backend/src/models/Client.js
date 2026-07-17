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
  }
}, { timestamps: true });

clientSchema.index({ email: 1 });
clientSchema.index({ subscriptionStatus: 1 });
clientSchema.index({ isActive: 1 });

module.exports = mongoose.model('Client', clientSchema);
