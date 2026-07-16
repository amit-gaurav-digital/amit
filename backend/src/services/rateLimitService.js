const RateLimit = require('../models/RateLimit');
const RateLimitRule = require('../models/RateLimitRule');

class RateLimitService {
  constructor() {
    this.defaultRules = [
      {
        name: 'public_api_read',
        endpoint: '/api/blog',
        method: 'GET',
        userRole: 'anonymous',
        requestsPerWindow: 100,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 3600
      },
      {
        name: 'api_write_user',
        endpoint: '/api/blog',
        method: 'POST',
        userRole: 'user',
        requestsPerWindow: 50,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 1800
      },
      {
        name: 'api_write_admin',
        endpoint: '/api/blog',
        method: 'POST',
        userRole: 'admin',
        requestsPerWindow: 500,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 900
      },
      {
        name: 'auth_login',
        endpoint: '/api/auth/login',
        method: 'POST',
        userRole: 'anonymous',
        requestsPerWindow: 5,
        windowDurationSeconds: 900,
        blockDurationSeconds: 900,
        blockMessage: 'Too many login attempts. Please try again later.'
      },
      {
        name: 'translation_service',
        endpoint: '/api/translation',
        method: 'POST',
        userRole: 'user',
        requestsPerWindow: 20,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 3600
      },
      {
        name: 'social_media_post',
        endpoint: '/api/social-media/post',
        method: 'POST',
        userRole: 'user',
        requestsPerWindow: 30,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 1800
      }
    ];
  }

  async initializeDefaultRules() {
    try {
      for (const rule of this.defaultRules) {
        await RateLimitRule.findOneAndUpdate(
          { name: rule.name },
          rule,
          { upsert: true }
        );
      }
      console.log('Rate limit rules initialized');
    } catch (error) {
      console.error('Failed to initialize rate limit rules:', error.message);
    }
  }

  async checkRateLimit(userId, ipAddress, endpoint, method, userRole = 'user') {
    try {
      const rule = await this.findApplicableRule(endpoint, method, userRole);

      if (!rule || !rule.isActive) {
        return { allowed: true, rule: null };
      }

      if (rule.bypassRoles && rule.bypassRoles.includes(userRole)) {
        return { allowed: true, rule, bypassed: true };
      }

      const identifier = userId || ipAddress;
      const now = new Date();

      let rateLimitDoc = await RateLimit.findOne({
        [userId ? 'userId' : 'ipAddress']: identifier,
        endpoint,
        method,
        windowStart: { $gte: new Date(now - rule.windowDurationSeconds * 1000) }
      });

      if (!rateLimitDoc) {
        rateLimitDoc = new RateLimit({
          [userId ? 'userId' : 'ipAddress']: identifier,
          endpoint,
          method,
          requestCount: 1,
          windowStart: now,
          windowDuration: rule.windowDurationSeconds * 1000
        });
        await rateLimitDoc.save();

        return {
          allowed: true,
          rule,
          remaining: rule.requestsPerWindow - 1,
          resetAt: new Date(now.getTime() + rule.windowDurationSeconds * 1000)
        };
      }

      if (rateLimitDoc.isBlocked && rateLimitDoc.blockedUntil > now) {
        return {
          allowed: false,
          rule,
          reason: rateLimitDoc.blockedReason || rule.blockMessage,
          blockedUntil: rateLimitDoc.blockedUntil,
          remainingBlockSeconds: Math.ceil((rateLimitDoc.blockedUntil - now) / 1000)
        };
      }

      rateLimitDoc.requestCount += 1;
      rateLimitDoc.updatedAt = now;

      if (rateLimitDoc.requestCount > rule.requestsPerWindow) {
        rateLimitDoc.isBlocked = true;
        rateLimitDoc.blockedUntil = new Date(now.getTime() + rule.blockDurationSeconds * 1000);
        rateLimitDoc.blockedReason = rule.blockMessage;
        await rateLimitDoc.save();

        return {
          allowed: false,
          rule,
          reason: rule.blockMessage,
          blockedUntil: rateLimitDoc.blockedUntil,
          remainingBlockSeconds: rule.blockDurationSeconds
        };
      }

      await rateLimitDoc.save();

      return {
        allowed: true,
        rule,
        remaining: rule.requestsPerWindow - rateLimitDoc.requestCount,
        resetAt: new Date(rateLimitDoc.windowStart.getTime() + rule.windowDurationSeconds * 1000)
      };
    } catch (error) {
      console.error('Rate limit check error:', error.message);
      return { allowed: true };
    }
  }

  async findApplicableRule(endpoint, method, userRole) {
    try {
      let rule = await RateLimitRule.findOne({
        endpoint,
        method,
        userRole,
        isActive: true
      });

      if (!rule) {
        rule = await RateLimitRule.findOne({
          endpoint,
          method: 'ALL',
          userRole,
          isActive: true
        });
      }

      if (!rule) {
        rule = await RateLimitRule.findOne({
          endpoint,
          method,
          userRole: 'all',
          isActive: true
        });
      }

      if (!rule) {
        rule = await RateLimitRule.findOne({
          endpoint,
          method: 'ALL',
          userRole: 'all',
          isActive: true
        });
      }

      return rule;
    } catch (error) {
      console.error('Failed to find applicable rule:', error.message);
      return null;
    }
  }

  async createRule(ruleData) {
    try {
      const rule = new RateLimitRule(ruleData);
      await rule.save();
      return rule.toObject();
    } catch (error) {
      throw new Error(`Failed to create rate limit rule: ${error.message}`);
    }
  }

  async updateRule(ruleId, ruleData) {
    try {
      const rule = await RateLimitRule.findByIdAndUpdate(ruleId, ruleData, { new: true });
      if (!rule) {
        throw new Error('Rule not found');
      }
      return rule.toObject();
    } catch (error) {
      throw new Error(`Failed to update rate limit rule: ${error.message}`);
    }
  }

  async deleteRule(ruleId) {
    try {
      const rule = await RateLimitRule.findByIdAndDelete(ruleId);
      if (!rule) {
        throw new Error('Rule not found');
      }
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete rate limit rule: ${error.message}`);
    }
  }

  async getRules(isActive = null) {
    try {
      const query = isActive !== null ? { isActive } : {};
      const rules = await RateLimitRule.find(query).sort({ createdAt: -1 });
      return rules.map(r => r.toObject());
    } catch (error) {
      throw new Error(`Failed to get rules: ${error.message}`);
    }
  }

  async getRateLimitStats(userId = null, ipAddress = null) {
    try {
      const query = {};
      if (userId) query.userId = userId;
      if (ipAddress) query.ipAddress = ipAddress;

      const limits = await RateLimit.find(query).sort({ updatedAt: -1 }).limit(50);

      const stats = {
        totalRequests: limits.reduce((sum, l) => sum + l.requestCount, 0),
        blockedCount: limits.filter(l => l.isBlocked).length,
        endpoints: {},
        topEndpoints: [],
        recentBlocks: []
      };

      limits.forEach(limit => {
        if (!stats.endpoints[limit.endpoint]) {
          stats.endpoints[limit.endpoint] = {
            endpoint: limit.endpoint,
            method: limit.method,
            requests: 0,
            blocked: false
          };
        }
        stats.endpoints[limit.endpoint].requests += limit.requestCount;
        stats.endpoints[limit.endpoint].blocked = limit.isBlocked;
      });

      stats.topEndpoints = Object.values(stats.endpoints)
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);

      stats.recentBlocks = limits
        .filter(l => l.isBlocked)
        .map(l => ({
          endpoint: l.endpoint,
          method: l.method,
          blockedAt: l.blockedUntil,
          reason: l.blockedReason
        }))
        .slice(0, 10);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get rate limit stats: ${error.message}`);
    }
  }

  async unblockIdentifier(userId = null, ipAddress = null) {
    try {
      const query = {
        isBlocked: true
      };

      if (userId) query.userId = userId;
      if (ipAddress) query.ipAddress = ipAddress;

      const result = await RateLimit.updateMany(query, {
        isBlocked: false,
        blockedUntil: null,
        blockedReason: null
      });

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new Error(`Failed to unblock identifier: ${error.message}`);
    }
  }

  async clearOldRateLimits() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await RateLimit.deleteMany({
        updatedAt: { $lt: sevenDaysAgo },
        isBlocked: false
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw new Error(`Failed to clear old rate limits: ${error.message}`);
    }
  }

  async getUserRateLimitStatus(userId) {
    try {
      const limits = await RateLimit.find({ userId }).sort({ updatedAt: -1 }).limit(10);

      const status = {
        userId,
        totalRequests: limits.reduce((sum, l) => sum + l.requestCount, 0),
        blocked: limits.some(l => l.isBlocked),
        limitedEndpoints: limits.map(l => ({
          endpoint: l.endpoint,
          method: l.method,
          requests: l.requestCount,
          isBlocked: l.isBlocked,
          blockedUntil: l.blockedUntil
        }))
      };

      return status;
    } catch (error) {
      throw new Error(`Failed to get user rate limit status: ${error.message}`);
    }
  }
}

module.exports = new RateLimitService();
