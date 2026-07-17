const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  segmentId: { type: String, required: true, unique: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Blog', index: true },

  segmentType: {
    type: String,
    enum: ['device', 'traffic_source', 'geography', 'browser', 'os'],
    required: true,
    index: true
  },

  segmentValue: { type: String, required: true }, // e.g., 'desktop', 'organic', 'US', 'Chrome', 'Windows'

  date: { type: Date, required: true, index: true },

  metrics: {
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    sessions: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    avgPageLoadTime: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  },

  hourlyBreakdown: [{
    hour: Number, // 0-23
    views: Number,
    visitors: Number,
    duration: Number,
    bounceRate: Number
  }],

  comparison: {
    previousPeriodMetrics: mongoose.Schema.Types.Mixed,
    changePercent: mongoose.Schema.Types.Mixed
  },

  topPages: [{
    url: String,
    views: Number,
    visitors: Number,
    engagement: Number
  }],

  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

segmentSchema.index({ blogId: 1, date: -1, segmentType: 1 });
segmentSchema.index({ blogId: 1, segmentType: 1, segmentValue: 1, date: -1 });
segmentSchema.index({ date: 1, expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AnalyticsSegment', segmentSchema);
