const mongoose = require('mongoose');

const abTestResultSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ABTest',
    required: true,
    index: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  variantName: {
    type: String,
    required: true
  },
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    avgTimeOnPage: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    scrollDepth: {
      type: Number,
      default: 0
    }
  },
  calculations: {
    conversionRate: {
      type: Number,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    }
  },
  dailyMetrics: [{
    date: Date,
    views: Number,
    clicks: Number,
    conversions: Number,
    shares: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

abTestResultSchema.index({ testId: 1, variantId: 1 });
abTestResultSchema.index({ testId: 1 });

abTestResultSchema.methods.calculateMetrics = function() {
  if (this.metrics.views > 0) {
    this.calculations.conversionRate = (this.metrics.conversions / this.metrics.views) * 100;
    this.calculations.clickThroughRate = (this.metrics.clicks / this.metrics.views) * 100;
    this.calculations.bounceRate = this.metrics.bounceRate;
    this.calculations.avgSessionDuration = this.metrics.avgTimeOnPage;
  }
  return this;
};

abTestResultSchema.statics.recordEvent = async function(testId, variantId, eventType, data = {}) {
  const update = {};

  switch (eventType) {
    case 'view':
      update['$inc'] = { 'metrics.views': 1, 'metrics.uniqueVisitors': data.unique ? 1 : 0 };
      break;
    case 'click':
      update['$inc'] = { 'metrics.clicks': 1 };
      break;
    case 'conversion':
      update['$inc'] = { 'metrics.conversions': 1 };
      break;
    case 'share':
      update['$inc'] = { 'metrics.shares': 1 };
      break;
    case 'comment':
      update['$inc'] = { 'metrics.comments': 1 };
      break;
  }

  return this.findOneAndUpdate(
    { testId, variantId },
    update,
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('ABTestResult', abTestResultSchema);
