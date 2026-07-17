const mongoose = require('mongoose');

const gaConfigSchema = new mongoose.Schema({
  configId: { type: String, required: true, unique: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client', index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', index: true },

  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'expired', 'error'],
    default: 'disconnected'
  },

  gaAccountInfo: {
    accountId: String,
    propertyId: String,
    propertyName: String,
    websiteUrl: String,
    timeZone: String,
    industryCategory: String
  },

  oauth: {
    accessToken: { type: String, select: false }, // never select by default
    refreshToken: { type: String, select: false },
    expiresAt: Date,
    scope: [String]
  },

  syncSettings: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['hourly', '6hourly', 'daily'], default: 'daily' },
    lastSyncAt: Date,
    nextSyncAt: Date,
    syncStatus: { type: String, enum: ['idle', 'syncing', 'completed', 'failed'] },
    scEnabled: { type: Boolean, default: false },
    scLastSyncAt: Date,
    scNextSyncAt: Date,
    scSyncStatus: { type: String, enum: ['idle', 'syncing', 'completed', 'failed'] },
    scSyncErrors: [{
      timestamp: Date,
      error: String,
      details: String
    }]
  },

  scSiteUrl: String,

  metricsMapped: {
    pageViews: { type: String, default: 'screenPageViews' },
    visitors: { type: String, default: 'activeUsers' },
    bounceRate: { type: String, default: 'bounceRate' },
    avgSessionDuration: { type: String, default: 'averageSessionDuration' },
    conversionRate: { type: String, default: 'conversionRate' }
  },

  dataRetention: {
    daysToKeep: { type: Number, default: 90 },
    autoDelete: { type: Boolean, default: true }
  },

  syncErrors: [{
    timestamp: Date,
    error: String,
    details: String,
    resolvedAt: Date
  }],

  connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  connectedAt: { type: Date, default: Date.now },
  disconnectedAt: Date,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

gaConfigSchema.index({ clientId: 1 });
gaConfigSchema.index({ 'syncSettings.nextSyncAt': 1 });

module.exports = mongoose.model('GoogleAnalyticsConfig', gaConfigSchema);
