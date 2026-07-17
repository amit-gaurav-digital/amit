const mongoose = require('mongoose');

const scDataSchema = new mongoose.Schema({
  dataId: { type: String, required: true, unique: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', index: true },
  siteUrl: { type: String, required: true },

  date: { type: Date, required: true, index: true },

  summary: {
    totalClicks: Number,
    totalImpressions: Number,
    averageCTR: Number,
    averagePosition: Number,
    totalQueries: Number
  },

  queries: [{
    query: String,
    clicks: Number,
    impressions: Number,
    ctr: Number,
    position: Number
  }],

  pages: [{
    page: String,
    clicks: Number,
    impressions: Number,
    ctr: Number,
    position: Number
  }],

  countries: [{
    country: String,
    clicks: Number,
    impressions: Number,
    ctr: Number,
    position: Number
  }],

  devices: {
    mobile: { clicks: Number, impressions: Number, ctr: Number, position: Number },
    desktop: { clicks: Number, impressions: Number, ctr: Number, position: Number },
    tablet: { clicks: Number, impressions: Number, ctr: Number, position: Number }
  },

  searchType: {
    web: { clicks: Number, impressions: Number, ctr: Number, position: Number },
    image: { clicks: Number, impressions: Number, ctr: Number, position: Number },
    video: { clicks: Number, impressions: Number, ctr: Number, position: Number },
    news: { clicks: Number, impressions: Number, ctr: Number, position: Number }
  },

  coverage: {
    indexed: Number,
    notIndexed: Number,
    excluded: Number,
    pendingIndexing: Number,
    crawlErrors: Number,
    urlErrors: [{
      url: String,
      error: String,
      firstDetected: Date,
      lastDetected: Date
    }]
  },

  crawlStats: {
    totalRequests: Number,
    totalKB: Number,
    averageResponseTime: Number,
    crawlErrors: [{
      url: String,
      error: String,
      lastCrawled: Date
    }]
  },

  security: {
    secureUrls: Number,
    insecureUrls: Number,
    mobileUsability: {
      total: Number,
      errors: Number,
      warnings: Number
    },
    mobileFriendly: Boolean
  },

  sitemap: [{
    url: String,
    type: String,
    submittedDate: Date,
    indexedUrls: Number,
    errors: Number,
    warnings: Number
  }],

  syncStatus: {
    syncedAt: Date,
    raw: mongoose.Schema.Types.Mixed
  },

  expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

scDataSchema.index({ blogId: 1, date: -1 });
scDataSchema.index({ clientId: 1, date: -1 });
scDataSchema.index({ siteUrl: 1, date: -1 });
scDataSchema.index({ date: 1, expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SearchConsoleData', scDataSchema);
