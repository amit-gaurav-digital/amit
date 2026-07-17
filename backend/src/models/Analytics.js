const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },

  // EXISTING FIELDS (kept as-is)
  metrics: {
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0, min: 0, max: 100 },
    avgTimeOnPage: { type: Number, default: 0 },
    clickThroughs: { type: Number, default: 0 },
    socialShares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    scrollDepth: { type: Number, default: 0, min: 0, max: 100 }
  },
  trafficSources: {
    organic: { type: Number, default: 0 },
    direct: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  },
  deviceBreakdown: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },
  geography: [{
    country: String,
    views: Number,
    visitors: Number
  }],
  referrers: [{
    source: String,
    views: Number,
    clickThroughs: Number
  }],
  searchTerms: [{
    term: String,
    impressions: Number,
    clicks: Number,
    avgPosition: Number
  }],

  // NEW FIELDS - Phase 1

  // Hourly breakdown for granular analysis
  hourlyMetrics: [{
    hour: { type: Number, min: 0, max: 23 },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  }],

  // User behavior patterns
  userBehavior: {
    returnVisitorPercentage: { type: Number, default: 0, min: 0, max: 100 },
    newVisitorPercentage: { type: Number, default: 0, min: 0, max: 100 },
    visitFrequency: {
      bounced: { type: Number, default: 0 },
      visitedOnce: { type: Number, default: 0 },
      visitedTwiceToFive: { type: Number, default: 0 },
      visitedMoreThanFive: { type: Number, default: 0 }
    }
  },

  // Engagement depth
  engagementMetrics: {
    avgSessionDuration: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    sessionBounceRate: { type: Number, default: 0 },
    goalCompletions: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Content performance
  contentMetrics: {
    readCompletionRate: { type: Number, default: 0 },
    avgReadTime: { type: Number, default: 0 },
    interactiveElementClicks: { type: Number, default: 0 },
    formSubmissions: { type: Number, default: 0 },
    downloadClicks: { type: Number, default: 0 }
  },

  // Performance metrics
  performanceMetrics: {
    pageLoadTime: { type: Number, default: 0 },
    firstContentfulPaint: { type: Number, default: 0 },
    largestContentfulPaint: { type: Number, default: 0 },
    cumulativeLayoutShift: { type: Number, default: 0 },
    timeToInteractive: { type: Number, default: 0 }
  },

  // Engagement score calculation
  engagementScore: { type: Number, default: 0, min: 0, max: 100 },
  performanceIndex: { type: Number, default: 0, min: 0, max: 100 },

  // Data quality tracking
  dataQuality: {
    completeness: { type: Number, default: 100, min: 0, max: 100 },
    accuracy: { type: Number, default: 100, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
    recordCount: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

analyticsSchema.index({ blogId: 1, date: -1 });
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ 'dataQuality.lastUpdated': 1 });

// EXISTING METHODS
analyticsSchema.statics.recordPageView = async function(blogId, source, device, country) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const update = {
    $inc: {
      'metrics.pageViews': 1,
      [`trafficSources.${source}`]: 1,
      [`deviceBreakdown.${device}`]: 1
    }
  };

  if (country) {
    await this.findOneAndUpdate(
      { blogId, date: today },
      { $inc: { 'geography.$.views': 1 } },
      { upsert: false }
    );
  }

  return this.findOneAndUpdate(
    { blogId, date: today },
    update,
    { upsert: true, new: true }
  );
};

analyticsSchema.statics.getMetricsForBlog = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$blogId',
        totalViews: { $sum: '$metrics.pageViews' },
        totalVisitors: { $sum: '$metrics.uniqueVisitors' },
        avgBounceRate: { $avg: '$metrics.bounceRate' },
        avgTimeOnPage: { $avg: '$metrics.avgTimeOnPage' },
        totalClicks: { $sum: '$metrics.clickThroughs' },
        totalShares: { $sum: '$metrics.socialShares' },
        totalComments: { $sum: '$metrics.comments' },
        totalLikes: { $sum: '$metrics.likes' },
        avgScrollDepth: { $avg: '$metrics.scrollDepth' }
      }
    }
  ]);
};

analyticsSchema.statics.getTopPerformingBlogs = async function(limit = 10, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$blogId',
        totalViews: { $sum: '$metrics.pageViews' },
        totalVisitors: { $sum: '$metrics.uniqueVisitors' },
        avgEngagement: { $avg: '$metrics.clickThroughs' },
        totalShares: { $sum: '$metrics.socialShares' }
      }
    },
    {
      $sort: { totalViews: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'blogs',
        localField: '_id',
        foreignField: '_id',
        as: 'blog'
      }
    },
    {
      $unwind: '$blog'
    }
  ]);
};

analyticsSchema.statics.getDailyTrend = async function(blogId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        date: { $gte: startDate }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        pageViews: '$metrics.pageViews',
        uniqueVisitors: '$metrics.uniqueVisitors',
        bounceRate: '$metrics.bounceRate',
        avgTimeOnPage: '$metrics.avgTimeOnPage',
        clickThroughs: '$metrics.clickThroughs'
      }
    }
  ]);
};

// NEW METHODS - Phase 1

analyticsSchema.statics.getEngagementMetrics = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        avgEngagementScore: { $avg: '$engagementScore' },
        avgPerformanceIndex: { $avg: '$performanceIndex' },
        totalSessionDuration: { $sum: '$engagementMetrics.avgSessionDuration' },
        totalConversions: { $sum: '$engagementMetrics.conversions' },
        avgConversionRate: { $avg: '$engagementMetrics.conversionRate' },
        avgReadCompletion: { $avg: '$contentMetrics.readCompletionRate' }
      }
    }
  ]);
};

analyticsSchema.statics.getHourlyBreakdown = async function(blogId, date) {
  return this.findOne(
    { blogId: mongoose.Types.ObjectId(blogId), date: new Date(date) },
    { hourlyMetrics: 1 }
  );
};

analyticsSchema.statics.getPerformanceMetrics = async function(blogId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        blogId: mongoose.Types.ObjectId(blogId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        avgPageLoadTime: { $avg: '$performanceMetrics.pageLoadTime' },
        avgFCP: { $avg: '$performanceMetrics.firstContentfulPaint' },
        avgLCP: { $avg: '$performanceMetrics.largestContentfulPaint' },
        avgCLS: { $avg: '$performanceMetrics.cumulativeLayoutShift' },
        avgTTI: { $avg: '$performanceMetrics.timeToInteractive' }
      }
    }
  ]);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
