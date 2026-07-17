const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
  comparisonId: { type: String, required: true, unique: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  name: { type: String, required: true },
  description: String,

  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }], // IDs of blogs to compare

  dateRange: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  metrics: [String], // e.g., ['views', 'visitors', 'engagement', 'bounceRate', 'loadTime']

  comparisonData: [{
    blogId: mongoose.Schema.Types.ObjectId,
    blogTitle: String,
    rank: Number,
    metrics: {
      pageViews: Number,
      uniqueVisitors: Number,
      bounceRate: Number,
      avgSessionDuration: Number,
      engagementScore: Number,
      conversionRate: Number,
      avgPageLoadTime: Number
    },
    trends: {
      views: {
        current: Number,
        previous: Number,
        growth: Number
      },
      visitors: {
        current: Number,
        previous: Number,
        growth: Number
      }
    },
    topReferrers: [{
      source: String,
      views: Number
    }],
    topCountries: [{
      country: String,
      views: Number
    }]
  }],

  summary: {
    totalBlogs: Number,
    topBlog: mongoose.Schema.Types.ObjectId,
    lowestBlog: mongoose.Schema.Types.ObjectId,
    averageMetrics: mongoose.Schema.Types.Mixed,
    bestPerformers: [mongoose.Schema.Types.ObjectId],
    needsAttention: [mongoose.Schema.Types.ObjectId]
  },

  saved: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

comparisonSchema.index({ clientId: 1, createdAt: -1 });
comparisonSchema.index({ 'blogs': 1 });

module.exports = mongoose.model('AnalyticsComparison', comparisonSchema);
