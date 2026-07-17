const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  eventId: {
    type: String,
    unique: true,
    required: true
  },

  // Event details
  eventType: {
    type: String,
    enum: ['page_view', 'click', 'scroll', 'form_submit', 'video_play', 'download', 'engagement'],
    required: true
  },
  category: {
    type: String,
    enum: ['engagement', 'content', 'conversion', 'technical'],
    default: 'engagement'
  },
  action: String,
  label: String,
  value: {
    type: Number,
    default: 0
  },

  // Timing
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  eventOrder: Number,
  timeOnPage: Number,

  // Location
  pageUrl: String,
  elementId: String,
  elementClass: String,
  elementType: String,

  // User context
  userId: String,
  userAgent: String,

  // Conversion event data
  conversionData: {
    isConversion: {
      type: Boolean,
      default: false
    },
    conversionType: String,
    conversionValue: Number,
    conversionCurrency: String,
    conversionGoal: String
  },

  // Custom properties
  customProperties: mongoose.Schema.Types.Mixed,

  // TTL - delete after 90 days
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Indexes
analyticsEventSchema.index({ blogId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ 'conversionData.isConversion': 1, timestamp: -1 });

// Methods for analytics queries
analyticsEventSchema.statics.getEventSummary = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
        totalValue: { $sum: '$value' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueSessionCount: { $size: '$uniqueSessions' },
        totalValue: 1,
        _id: 0
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

analyticsEventSchema.statics.getConversionEvents = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        'conversionData.isConversion': true,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$conversionData.conversionType',
        count: { $sum: 1 },
        totalValue: { $sum: '$conversionData.conversionValue' },
        avgValue: { $avg: '$conversionData.conversionValue' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

analyticsEventSchema.statics.getEventsByPage = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$pageUrl',
        totalEvents: { $sum: 1 },
        clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
        conversions: { $sum: { $cond: ['$conversionData.isConversion', 1, 0] } },
        avgTimeOnPage: { $avg: '$timeOnPage' }
      }
    },
    {
      $sort: { totalEvents: -1 }
    }
  ]);
};

analyticsEventSchema.statics.recordEvent = async function(blogId, sessionId, eventData) {
  const event = new this({
    blogId,
    sessionId,
    eventId: `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...eventData
  });
  return event.save();
};

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
