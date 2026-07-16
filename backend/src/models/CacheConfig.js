const mongoose = require('mongoose');

const cacheConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'ALL'],
    default: 'GET'
  },
  ttlSeconds: {
    type: Number,
    required: true,
    min: 1
  },
  strategy: {
    type: String,
    enum: ['memory', 'database', 'hybrid'],
    default: 'hybrid'
  },
  cacheable: {
    type: Boolean,
    default: true
  },
  includeHeaders: [String],
  excludeHeaders: [String],
  queryParamsDontAffect: [String],
  maxSize: {
    type: Number,
    default: 1000000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

cacheConfigSchema.index({ endpoint: 1, method: 1 });
cacheConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('CacheConfig', cacheConfigSchema);
