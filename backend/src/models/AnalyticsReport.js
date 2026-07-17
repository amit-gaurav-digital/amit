const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Blog', index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'],
    default: 'weekly'
  },

  metrics: [String], // e.g., ['views', 'visitors', 'engagement', 'bounceRate']

  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: String, // 'daily', 'weekly', 'monthly'
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    time: String, // HH:mm format
    timezone: { type: String, default: 'UTC' }
  },

  emailRecipients: [String], // email addresses to send report to

  dateRange: {
    type: { type: String, enum: ['preset', 'custom'] },
    preset: String, // '7days', '30days', '90days', '365days'
    customStart: Date,
    customEnd: Date
  },

  segments: {
    deviceType: [String], // ['desktop', 'mobile', 'tablet']
    trafficSource: [String], // ['organic', 'direct', 'referral', 'social', 'email', 'paid']
    country: [String] // country codes
  },

  generatedReports: [{
    generatedAt: Date,
    startDate: Date,
    endDate: Date,
    data: mongoose.Schema.Types.Mixed,
    emailSentAt: Date,
    pdfUrl: String,
    status: { type: String, enum: ['generated', 'sent', 'failed'] }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastGeneratedAt: Date
}, { timestamps: true });

reportSchema.index({ blogId: 1, createdAt: -1 });
reportSchema.index({ clientId: 1, 'schedule.enabled': 1 });
reportSchema.index({ 'generatedReports.generatedAt': -1 });

module.exports = mongoose.model('AnalyticsReport', reportSchema);
