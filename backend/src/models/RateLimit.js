const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  ipAddress: {
    type: String,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  requestCount: {
    type: Number,
    default: 0
  },
  windowStart: {
    type: Date,
    default: Date.now
  },
  windowDuration: {
    type: Number,
    default: 3600000
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: Date,
  blockedReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

rateLimitSchema.index({ userId: 1, endpoint: 1, windowStart: 1 });
rateLimitSchema.index({ ipAddress: 1, endpoint: 1, windowStart: 1 });
rateLimitSchema.index({ isBlocked: 1, blockedUntil: 1 });
rateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('RateLimit', rateLimitSchema);
