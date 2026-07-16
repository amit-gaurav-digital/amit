const mongoose = require('mongoose');

const cacheStatsSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  hits: {
    type: Number,
    default: 0
  },
  misses: {
    type: Number,
    default: 0
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  avgResponseTime: {
    type: Number,
    default: 0
  },
  cachedResponseTime: {
    type: Number,
    default: 0
  },
  uncachedResponseTime: {
    type: Number,
    default: 0
  },
  cacheSize: {
    type: Number,
    default: 0
  },
  lastAccessAt: Date,
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

cacheStatsSchema.index({ endpoint: 1, date: -1 });
cacheStatsSchema.index({ date: 1 }, { expireAfterSeconds: 2592000 });

cacheStatsSchema.methods.getHitRate = function() {
  if (this.totalRequests === 0) return 0;
  return Math.round((this.hits / this.totalRequests) * 100);
};

cacheStatsSchema.methods.recordHit = function(responseTime = 0) {
  this.hits += 1;
  this.totalRequests += 1;
  this.cachedResponseTime = (this.cachedResponseTime * (this.hits - 1) + responseTime) / this.hits;
  this.lastAccessAt = new Date();
  return this;
};

cacheStatsSchema.methods.recordMiss = function(responseTime = 0) {
  this.misses += 1;
  this.totalRequests += 1;
  this.uncachedResponseTime = (this.uncachedResponseTime * (this.misses - 1) + responseTime) / this.misses;
  this.lastAccessAt = new Date();
  return this;
};

module.exports = mongoose.model('CacheStats', cacheStatsSchema);
