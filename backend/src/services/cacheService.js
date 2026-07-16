const CacheConfig = require('../models/CacheConfig');
const CacheStats = require('../models/CacheStats');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheMetadata = new Map();
    this.stats = new Map();
  }

  generateCacheKey(endpoint, method, queryParams = {}, userId = null) {
    const config = this.configCache?.get(`${endpoint}:${method}`);
    const relevantParams = this.filterQueryParams(queryParams, config?.queryParamsDontAffect || []);
    const paramsString = JSON.stringify(relevantParams);
    const keyString = `${endpoint}:${method}:${paramsString}:${userId || 'anon'}`;
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  filterQueryParams(params, excludeKeys = []) {
    const filtered = {};
    Object.keys(params).forEach(key => {
      if (!excludeKeys.includes(key)) {
        filtered[key] = params[key];
      }
    });
    return filtered;
  }

  async initializeDefaultConfigs() {
    try {
      const defaultConfigs = [
        {
          key: 'blogs_list',
          endpoint: '/api/blog',
          method: 'GET',
          ttlSeconds: 300,
          strategy: 'hybrid',
          description: 'Cache for blog listing endpoint'
        },
        {
          key: 'blog_detail',
          endpoint: '/api/blog/:id',
          method: 'GET',
          ttlSeconds: 600,
          strategy: 'hybrid',
          description: 'Cache for individual blog details'
        },
        {
          key: 'translations',
          endpoint: '/api/translation/translations',
          method: 'GET',
          ttlSeconds: 300,
          strategy: 'hybrid',
          description: 'Cache for translations list'
        },
        {
          key: 'analytics_dashboard',
          endpoint: '/api/analytics/dashboard',
          method: 'GET',
          ttlSeconds: 60,
          strategy: 'hybrid',
          description: 'Cache for analytics dashboard'
        },
        {
          key: 'languages_list',
          endpoint: '/api/translation/languages',
          method: 'GET',
          ttlSeconds: 3600,
          strategy: 'memory',
          description: 'Cache for available languages (long-lived)'
        }
      ];

      for (const config of defaultConfigs) {
        await CacheConfig.findOneAndUpdate(
          { key: config.key },
          config,
          { upsert: true }
        );
      }

      await this.loadCacheConfigs();
      console.log('Cache configurations initialized');
    } catch (error) {
      console.error('Failed to initialize cache configs:', error.message);
    }
  }

  async loadCacheConfigs() {
    try {
      const configs = await CacheConfig.find({ isActive: true });
      this.configCache = new Map();
      configs.forEach(config => {
        this.configCache.set(`${config.endpoint}:${config.method}`, config.toObject());
      });
    } catch (error) {
      console.error('Failed to load cache configs:', error.message);
    }
  }

  getConfig(endpoint, method = 'GET') {
    if (!this.configCache) return null;
    return this.configCache.get(`${endpoint}:${method}`);
  }

  async getCachedResponse(cacheKey) {
    try {
      const cached = this.memoryCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        await this.recordCacheHit(cached.endpoint, cached.method, cached.responseTime);
        return {
          data: cached.data,
          isCached: true,
          responseTime: cached.responseTime
        };
      }

      if (cached) {
        this.memoryCache.delete(cacheKey);
      }

      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error.message);
      return null;
    }
  }

  async setCachedResponse(cacheKey, endpoint, method, data, responseTime = 0) {
    try {
      const config = this.getConfig(endpoint, method);

      if (!config || !config.cacheable) {
        return;
      }

      const serialized = JSON.stringify(data);
      if (serialized.length > config.maxSize) {
        console.warn(`Cache size exceeded for ${endpoint}`);
        return;
      }

      const expiresAt = Date.now() + config.ttlSeconds * 1000;

      this.memoryCache.set(cacheKey, {
        data,
        endpoint,
        method,
        responseTime,
        expiresAt,
        createdAt: Date.now(),
        size: serialized.length
      });

      this.cacheMetadata.set(cacheKey, {
        endpoint,
        method,
        expiresAt,
        size: serialized.length
      });

      await this.recordCacheMiss(endpoint, method, responseTime);
    } catch (error) {
      console.error('Cache storage error:', error.message);
    }
  }

  async invalidateCache(endpoint, method = null) {
    try {
      let invalidatedCount = 0;

      for (const [key, metadata] of this.cacheMetadata.entries()) {
        if (metadata.endpoint === endpoint) {
          if (!method || metadata.method === method) {
            this.memoryCache.delete(key);
            this.cacheMetadata.delete(key);
            invalidatedCount++;
          }
        }
      }

      return { invalidatedCount };
    } catch (error) {
      throw new Error(`Cache invalidation failed: ${error.message}`);
    }
  }

  async invalidateCachePattern(pattern) {
    try {
      let invalidatedCount = 0;
      const regex = new RegExp(pattern);

      for (const [key, metadata] of this.cacheMetadata.entries()) {
        if (regex.test(metadata.endpoint)) {
          this.memoryCache.delete(key);
          this.cacheMetadata.delete(key);
          invalidatedCount++;
        }
      }

      return { invalidatedCount };
    } catch (error) {
      throw new Error(`Pattern invalidation failed: ${error.message}`);
    }
  }

  async recordCacheHit(endpoint, method, responseTime = 0) {
    try {
      const date = new Date().setHours(0, 0, 0, 0);

      await CacheStats.findOneAndUpdate(
        { endpoint, method, date: new Date(date) },
        {
          $inc: { hits: 1 },
          lastAccessAt: new Date()
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to record cache hit:', error.message);
    }
  }

  async recordCacheMiss(endpoint, method, responseTime = 0) {
    try {
      const date = new Date().setHours(0, 0, 0, 0);

      await CacheStats.findOneAndUpdate(
        { endpoint, method, date: new Date(date) },
        {
          $inc: { misses: 1 },
          lastAccessAt: new Date()
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to record cache miss:', error.message);
    }
  }

  async getCacheStats(endpoint = null, method = null, days = 30) {
    try {
      const query = {};
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      if (endpoint) query.endpoint = endpoint;
      if (method) query.method = method;

      query.date = { $gte: startDate };

      const stats = await CacheStats.find(query).sort({ date: -1 });

      if (!stats || stats.length === 0) {
        return {
          totalHits: 0,
          totalMisses: 0,
          hitRate: 0,
          averageResponseTime: 0,
          endpoints: []
        };
      }

      const totalHits = stats.reduce((sum, s) => sum + s.hits, 0);
      const totalMisses = stats.reduce((sum, s) => sum + s.misses, 0);
      const hitRate = totalHits + totalMisses > 0
        ? Math.round((totalHits / (totalHits + totalMisses)) * 100)
        : 0;

      const avgResponse = stats.length > 0
        ? Math.round(stats.reduce((sum, s) => sum + (s.cachedResponseTime || 0), 0) / stats.length)
        : 0;

      const endpointStats = {};
      stats.forEach(stat => {
        if (!endpointStats[stat.endpoint]) {
          endpointStats[stat.endpoint] = {
            endpoint: stat.endpoint,
            method: stat.method,
            hits: 0,
            misses: 0,
            hitRate: 0
          };
        }
        endpointStats[stat.endpoint].hits += stat.hits;
        endpointStats[stat.endpoint].misses += stat.misses;
        endpointStats[stat.endpoint].hitRate = Math.round(
          (endpointStats[stat.endpoint].hits / (endpointStats[stat.endpoint].hits + endpointStats[stat.endpoint].misses)) * 100
        );
      });

      return {
        totalHits,
        totalMisses,
        hitRate,
        averageResponseTime: avgResponse,
        cachedResponseTime: Math.round(stats.reduce((sum, s) => sum + (s.cachedResponseTime || 0), 0) / stats.length),
        uncachedResponseTime: Math.round(stats.reduce((sum, s) => sum + (s.uncachedResponseTime || 0), 0) / stats.length),
        endpoints: Object.values(endpointStats).sort((a, b) => b.hits - a.hits)
      };
    } catch (error) {
      throw new Error(`Failed to get cache stats: ${error.message}`);
    }
  }

  async createCacheConfig(configData) {
    try {
      const config = new CacheConfig(configData);
      await config.save();
      await this.loadCacheConfigs();
      return config.toObject();
    } catch (error) {
      throw new Error(`Failed to create cache config: ${error.message}`);
    }
  }

  async updateCacheConfig(configId, configData) {
    try {
      const config = await CacheConfig.findByIdAndUpdate(configId, configData, { new: true });
      if (!config) {
        throw new Error('Config not found');
      }
      await this.loadCacheConfigs();
      return config.toObject();
    } catch (error) {
      throw new Error(`Failed to update cache config: ${error.message}`);
    }
  }

  async deleteCacheConfig(configId) {
    try {
      const config = await CacheConfig.findByIdAndDelete(configId);
      if (!config) {
        throw new Error('Config not found');
      }
      await this.loadCacheConfigs();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete cache config: ${error.message}`);
    }
  }

  async getCacheConfigs(isActive = null) {
    try {
      const query = isActive !== null ? { isActive } : {};
      const configs = await CacheConfig.find(query).sort({ endpoint: 1 });
      return configs.map(c => c.toObject());
    } catch (error) {
      throw new Error(`Failed to get cache configs: ${error.message}`);
    }
  }

  async getMemoryCacheSize() {
    let totalSize = 0;
    for (const [, metadata] of this.cacheMetadata.entries()) {
      totalSize += metadata.size || 0;
    }
    return {
      itemCount: this.memoryCache.size,
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      totalSizeMB: Math.round((totalSize / 1024) / 1024)
    };
  }

  async clearCache() {
    try {
      const count = this.memoryCache.size;
      this.memoryCache.clear();
      this.cacheMetadata.clear();
      return { clearedCount: count };
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }

  async clearExpiredCache() {
    try {
      let clearedCount = 0;
      const now = Date.now();

      for (const [key, metadata] of this.cacheMetadata.entries()) {
        if (metadata.expiresAt < now) {
          this.memoryCache.delete(key);
          this.cacheMetadata.delete(key);
          clearedCount++;
        }
      }

      return { clearedCount };
    } catch (error) {
      throw new Error(`Failed to clear expired cache: ${error.message}`);
    }
  }

  async getGlobalCacheStats() {
    try {
      const size = await this.getMemoryCacheSize();
      const stats = await this.getCacheStats();

      return {
        cacheSize: size,
        performance: stats,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get global cache stats: ${error.message}`);
    }
  }
}

module.exports = new CacheService();
