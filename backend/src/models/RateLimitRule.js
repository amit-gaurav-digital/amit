const mongoose = require('mongoose');

const rateLimitRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL'],
    default: 'ALL'
  },
  userRole: {
    type: String,
    enum: ['anonymous', 'user', 'admin', 'all'],
    default: 'all'
  },
  requestsPerWindow: {
    type: Number,
    required: true,
    min: 1
  },
  windowDurationSeconds: {
    type: Number,
    required: true,
    min: 1
  },
  blockDurationSeconds: {
    type: Number,
    default: 3600
  },
  blockMessage: {
    type: String,
    default: 'Rate limit exceeded. Please try again later.'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bypassRoles: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

rateLimitRuleSchema.index({ endpoint: 1, method: 1, userRole: 1 });
rateLimitRuleSchema.index({ isActive: 1 });

module.exports = mongoose.model('RateLimitRule', rateLimitRuleSchema);
