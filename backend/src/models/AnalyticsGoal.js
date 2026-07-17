const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  goalId: { type: String, required: true, unique: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Blog', index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['pageview', 'scroll_depth', 'time_on_page', 'click', 'form_submit', 'custom_event'],
    required: true
  },

  config: {
    pageUrl: String, // for pageview goals
    scrollPercentage: Number, // 25, 50, 75, 100
    minTimeSeconds: Number, // minimum time on page
    elementSelector: String, // CSS selector for click goals
    eventType: String, // custom event type
    customCondition: mongoose.Schema.Types.Mixed
  },

  value: { type: Number, default: 0 }, // monetary value if applicable
  currency: { type: String, default: 'USD' },

  conversionData: {
    totalConversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 }
  },

  dailyMetrics: [{
    date: Date,
    conversions: Number,
    revenue: Number,
    conversionRate: Number
  }],

  topReferrers: [{
    source: String,
    conversions: Number,
    conversionRate: Number
  }],

  topPages: [{
    url: String,
    conversions: Number,
    conversionRate: Number
  }],

  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

goalSchema.index({ blogId: 1, enabled: 1, createdAt: -1 });
goalSchema.index({ blogId: 1, type: 1 });
goalSchema.index({ 'dailyMetrics.date': -1 });

module.exports = mongoose.model('AnalyticsGoal', goalSchema);
