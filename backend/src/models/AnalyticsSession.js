const mongoose = require('mongoose');

const analyticsSessionSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: null
  },

  // Session basics
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  },

  // Entry/Exit
  entryPoint: String,
  exitPoint: String,
  pageSequence: [String],

  // Device & Environment
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  deviceBrand: String,
  browser: String,
  browserVersion: String,
  os: String,
  osVersion: String,
  screenResolution: String,

  // Geo + Network
  country: String,
  region: String,
  city: String,
  ipAddress: String,
  connectionType: String,

  // Traffic source
  source: {
    type: String,
    enum: ['organic', 'direct', 'referral', 'social', 'email', 'paid'],
    default: 'direct'
  },
  medium: String,
  campaign: String,
  referrer: String,

  // Interaction events
  events: [{
    type: {
      type: String,
      enum: ['click', 'scroll', 'input', 'video_play', 'download', 'form_submit']
    },
    elementId: String,
    elementType: String,
    timestamp: Date,
    x: Number,
    y: Number,
    depth: Number
  }],

  // Goals & conversions
  goalsCompleted: [String],
  conversionFlag: {
    type: Boolean,
    default: false
  },
  conversionValue: {
    type: Number,
    default: 0
  },

  // Behavior metrics
  scrollDepth: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  bounced: {
    type: Boolean,
    default: false
  },
  returned: {
    type: Boolean,
    default: false
  },

  // Performance
  pageLoadTime: Number,
  fcp: Number,
  lcp: Number,
  cls: Number,

  // Mobile specific
  appVersion: String,
  pushNotificationEnabled: {
    type: Boolean,
    default: false
  },

  metadata: mongoose.Schema.Types.Mixed,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for optimal query performance
analyticsSessionSchema.index({ blogId: 1, startTime: -1 });
analyticsSessionSchema.index({ sessionId: 1 });
analyticsSessionSchema.index({ source: 1, startTime: -1 });
analyticsSessionSchema.index({ deviceType: 1, startTime: -1 });
analyticsSessionSchema.index({ country: 1, startTime: -1 });

// Methods
analyticsSessionSchema.statics.getSessionAnalysis = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        startTime: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        bouncedSessions: { $sum: { $cond: ['$bounced', 1, 0] } },
        avgEngagementScore: { $avg: '$engagementScore' },
        convertedSessions: { $sum: { $cond: ['$conversionFlag', 1, 0] } },
        totalConversionValue: { $sum: '$conversionValue' },
        returnVisitors: { $sum: { $cond: ['$returned', 1, 0] } }
      }
    },
    {
      $project: {
        totalSessions: 1,
        avgDuration: { $round: ['$avgDuration', 2] },
        bounceRate: {
          $round: [{ $multiply: [{ $divide: ['$bouncedSessions', '$totalSessions'] }, 100] }, 2]
        },
        avgEngagementScore: { $round: ['$avgEngagementScore', 2] },
        conversionRate: {
          $round: [{ $multiply: [{ $divide: ['$convertedSessions', '$totalSessions'] }, 100] }, 2]
        },
        totalConversionValue: 1,
        returnVisitorPercentage: {
          $round: [{ $multiply: [{ $divide: ['$returnVisitors', '$totalSessions'] }, 100] }, 2]
        }
      }
    }
  ]);
};

analyticsSessionSchema.statics.getSessionsBySource = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        startTime: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgEngagementScore: { $avg: '$engagementScore' },
        conversionRate: { $avg: { $cond: ['$conversionFlag', 100, 0] } }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('AnalyticsSession', analyticsSessionSchema);
