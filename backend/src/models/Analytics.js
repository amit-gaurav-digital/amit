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
  metrics: {
    pageViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgTimeOnPage: {
      type: Number,
      default: 0
    },
    clickThroughs: {
      type: Number,
      default: 0
    },
    socialShares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    scrollDepth: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

analyticsSchema.index({ blogId: 1, date: -1 });
analyticsSchema.index({ date: -1 });

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

module.exports = mongoose.model('Analytics', analyticsSchema);
