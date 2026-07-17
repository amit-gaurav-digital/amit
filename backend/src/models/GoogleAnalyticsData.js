const mongoose = require('mongoose');

const gaDataSchema = new mongoose.Schema({
  dataId: { type: String, required: true, unique: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', index: true },
  propertyId: { type: String, required: true },

  date: { type: Date, required: true, index: true },

  realtime: {
    activeUsers: Number,
    topPages: [{
      pagePath: String,
      activeUsers: Number,
      pageViews: Number
    }],
    topCountries: [{
      country: String,
      activeUsers: Number
    }],
    topSources: [{
      source: String,
      activeUsers: Number
    }],
    updatedAt: Date
  },

  daily: {
    screenPageViews: Number,
    activeUsers: Number,
    bounceRate: Number,
    averageSessionDuration: Number,
    conversions: Number,
    conversionRate: Number,
    totalUsers: Number,
    newUsers: Number,
    returningUsers: Number,
    sessionsPerUser: Number
  },

  trafficChannels: {
    organic: { views: Number, users: Number, bounceRate: Number },
    direct: { views: Number, users: Number, bounceRate: Number },
    referral: { views: Number, users: Number, bounceRate: Number },
    social: { views: Number, users: Number, bounceRate: Number },
    email: { views: Number, users: Number, bounceRate: Number },
    paid: { views: Number, users: Number, bounceRate: Number }
  },

  geography: [{
    country: String,
    users: Number,
    sessions: Number,
    pageViews: Number,
    bounceRate: Number,
    avgSessionDuration: Number
  }],

  devices: {
    mobile: { users: Number, sessions: Number, bounceRate: Number },
    desktop: { users: Number, sessions: Number, bounceRate: Number },
    tablet: { users: Number, sessions: Number, bounceRate: Number }
  },

  topPages: [{
    pagePath: String,
    pageTitle: String,
    pageViews: Number,
    users: Number,
    bounceRate: Number,
    avgTimeOnPage: Number,
    conversions: Number
  }],

  topReferrers: [{
    referrer: String,
    users: Number,
    sessions: Number,
    pageViews: Number,
    bounceRate: Number
  }],

  searchTerms: [{
    query: String,
    impressions: Number,
    clicks: Number,
    ctr: Number,
    position: Number
  }],

  events: [{
    eventName: String,
    eventCount: Number,
    totalUsers: Number,
    conversionCount: Number
  }],

  syncStatus: {
    syncedAt: Date,
    raw: mongoose.Schema.Types.Mixed
  },

  expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

gaDataSchema.index({ blogId: 1, date: -1 });
gaDataSchema.index({ clientId: 1, date: -1 });
gaDataSchema.index({ propertyId: 1, date: -1 });
gaDataSchema.index({ date: 1, expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GoogleAnalyticsData', gaDataSchema);
