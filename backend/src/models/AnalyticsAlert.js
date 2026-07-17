const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Blog', index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  name: { type: String, required: true },
  description: String,

  metric: {
    type: String,
    enum: ['pageViews', 'visitors', 'bounceRate', 'engagementScore', 'conversionRate', 'pageLoadTime'],
    required: true
  },

  condition: {
    type: String,
    enum: ['increases_by', 'decreases_by', 'exceeds', 'drops_below', 'equals'],
    required: true
  },

  threshold: { type: Number, required: true },
  thresholdType: {
    type: String,
    enum: ['absolute', 'percent', 'standard_deviation'],
    default: 'absolute'
  },

  comparison: {
    type: String,
    enum: ['previous_day', 'previous_week', 'previous_month', 'average'],
    default: 'previous_day'
  },

  recipients: [String], // email addresses

  checkFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily'
  },

  enabled: { type: Boolean, default: true },

  triggeredAlerts: [{
    triggeredAt: Date,
    metricValue: Number,
    comparisonValue: Number,
    deviation: Number,
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: mongoose.Schema.Types.ObjectId,
    acknowledgedAt: Date,
    notes: String
  }],

  statistics: {
    totalTriggered: { type: Number, default: 0 },
    lastTriggered: Date,
    averageDeviation: Number,
    maxDeviation: Number
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

alertSchema.index({ blogId: 1, enabled: 1 });
alertSchema.index({ 'triggeredAlerts.triggeredAt': -1 });

module.exports = mongoose.model('AnalyticsAlert', alertSchema);
