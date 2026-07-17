const Redis = require('redis');

class RealtimeAnalyticsService {
  constructor(redisClient, io) {
    this.redis = redisClient;
    this.io = io;
  }

  // Track event in Redis with TTL (1 hour)
  async trackEvent(blogId, eventData) {
    const key = `analytics:blog:${blogId}:events`;
    const timestamp = Date.now();

    const event = {
      ...eventData,
      timestamp,
      id: `${blogId}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Add to events list (keep last 100 events)
    await this.redis.lpush(key, JSON.stringify(event));
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 3600); // 1 hour TTL

    // Increment counters
    await this.incrementMetric(blogId, 'totalEvents', 1);
    await this.incrementMetric(blogId, `events:${eventData.type}`, 1);

    // Emit via WebSocket to connected clients
    if (this.io) {
      this.io.to(`blog:${blogId}`).emit('analytics:event', event);
    }

    return event;
  }

  // Record a session start
  async startSession(blogId, sessionId, sessionData) {
    const key = `analytics:blog:${blogId}:sessions:${sessionId}`;

    const session = {
      sessionId,
      startTime: Date.now(),
      ...sessionData
    };

    await this.redis.hset(key, 'data', JSON.stringify(session));
    await this.redis.expire(key, 3600);

    // Add to active sessions set
    await this.redis.sadd(`analytics:blog:${blogId}:activeSessions`, sessionId);
    await this.redis.expire(`analytics:blog:${blogId}:activeSessions`, 3600);

    return session;
  }

  // End a session
  async endSession(blogId, sessionId) {
    const key = `analytics:blog:${blogId}:sessions:${sessionId}`;
    await this.redis.expire(key, 300); // Move to 5 min expiry
    await this.redis.srem(`analytics:blog:${blogId}:activeSessions`, sessionId);
  }

  // Get real-time metrics
  async getRealtimeMetrics(blogId) {
    const metricsKey = `analytics:blog:${blogId}:metrics`;
    const data = await this.redis.hgetall(metricsKey);

    if (!data || Object.keys(data).length === 0) {
      return this.getDefaultMetrics();
    }

    return {
      activeVisitors: parseInt(data.activeVisitors) || 0,
      viewsLastHour: parseInt(data.viewsLastHour) || 0,
      viewsLastDay: parseInt(data.viewsLastDay) || 0,
      eventsLastHour: parseInt(data.eventsLastHour) || 0,
      conversionsLastHour: parseInt(data.conversionsLastHour) || 0,
      avgEngagementScore: parseFloat(data.avgEngagementScore) || 0,
      bounceRate: parseFloat(data.bounceRate) || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  }

  // Get active visitors
  async getActiveVisitors(blogId) {
    const activeSessions = await this.redis.scard(`analytics:blog:${blogId}:activeSessions`);
    return activeSessions || 0;
  }

  // Get top pages in real-time
  async getActivePages(blogId, limit = 5) {
    const key = `analytics:blog:${blogId}:topPages`;
    const pages = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const result = [];
    for (let i = 0; i < pages.length; i += 2) {
      result.push({
        url: pages[i],
        views: parseInt(pages[i + 1])
      });
    }
    return result;
  }

  // Update metrics cache
  async updateMetricsCache(blogId, metrics) {
    const metricsKey = `analytics:blog:${blogId}:metrics`;

    const data = {
      activeVisitors: metrics.activeVisitors || 0,
      viewsLastHour: metrics.viewsLastHour || 0,
      viewsLastDay: metrics.viewsLastDay || 0,
      eventsLastHour: metrics.eventsLastHour || 0,
      conversionsLastHour: metrics.conversionsLastHour || 0,
      avgEngagementScore: metrics.avgEngagementScore || 0,
      bounceRate: metrics.bounceRate || 0,
      lastUpdated: new Date().toISOString()
    };

    await this.redis.hset(metricsKey, Object.keys(data).map(k => [k, data[k]]).flat());
    await this.redis.expire(metricsKey, 3600);

    // Emit update via WebSocket
    if (this.io) {
      this.io.to(`blog:${blogId}`).emit('analytics:metrics-update', data);
    }

    return data;
  }

  // Subscribe to real-time updates
  async subscribeToRealtimeUpdates(blogId, clientId) {
    if (this.io) {
      // Join client to blog's room
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        socket.join(`blog:${blogId}`);
        return true;
      }
    }
    return false;
  }

  // Unsubscribe from real-time updates
  async unsubscribeFromRealtimeUpdates(blogId, clientId) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        socket.leave(`blog:${blogId}`);
        return true;
      }
    }
    return false;
  }

  // Emit real-time alert
  async emitRealtimeAlert(blogId, alert) {
    if (this.io) {
      this.io.to(`blog:${blogId}`).emit('analytics:alert', {
        type: 'alert',
        alertType: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date().toISOString(),
        metric: alert.metric,
        value: alert.value
      });
    }
  }

  // Emit conversion event
  async emitConversion(blogId, conversionData) {
    if (this.io) {
      this.io.to(`blog:${blogId}`).emit('analytics:conversion', {
        type: 'conversion',
        goal: conversionData.goal,
        value: conversionData.value,
        timestamp: new Date().toISOString()
      });
    }

    // Increment conversion counter
    await this.incrementMetric(blogId, 'conversionsLastHour', 1);
  }

  // Increment a metric counter
  private async incrementMetric(blogId, metric, value = 1) {
    const key = `analytics:blog:${blogId}:metrics`;
    await this.redis.hincrby(key, metric, value);
    await this.redis.expire(key, 3600);
  }

  // Get default metrics structure
  private getDefaultMetrics() {
    return {
      activeVisitors: 0,
      viewsLastHour: 0,
      viewsLastDay: 0,
      eventsLastHour: 0,
      conversionsLastHour: 0,
      avgEngagementScore: 0,
      bounceRate: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Record page view
  async recordPageView(blogId, pageUrl, source = 'direct') {
    await this.incrementMetric(blogId, 'viewsLastHour', 1);
    await this.incrementMetric(blogId, 'viewsLastDay', 1);

    // Update top pages
    const key = `analytics:blog:${blogId}:topPages`;
    await this.redis.zincrby(key, 1, pageUrl);
    await this.redis.expire(key, 3600);

    // Update top sources
    const sourceKey = `analytics:blog:${blogId}:topSources`;
    await this.redis.zincrby(sourceKey, 1, source);
    await this.redis.expire(sourceKey, 3600);

    // Emit via WebSocket
    if (this.io) {
      this.io.to(`blog:${blogId}`).emit('analytics:page-view', {
        pageUrl,
        source,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get top sources in real-time
  async getTopSources(blogId, limit = 5) {
    const key = `analytics:blog:${blogId}:topSources`;
    const sources = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const result = [];
    for (let i = 0; i < sources.length; i += 2) {
      result.push({
        source: sources[i],
        count: parseInt(sources[i + 1])
      });
    }
    return result;
  }

  // Get recent events
  async getRecentEvents(blogId, limit = 10) {
    const key = `analytics:blog:${blogId}:events`;
    const events = await this.redis.lrange(key, 0, limit - 1);

    return events.map(event => JSON.parse(event));
  }

  // Clear cache for a blog
  async invalidateCache(blogId) {
    const pattern = `analytics:blog:${blogId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    return keys.length;
  }

  // Get live dashboard data
  async getLiveDashboard(blogId) {
    const [
      metrics,
      activeVisitors,
      topPages,
      topSources,
      recentEvents
    ] = await Promise.all([
      this.getRealtimeMetrics(blogId),
      this.getActiveVisitors(blogId),
      this.getActivePages(blogId, 10),
      this.getTopSources(blogId, 10),
      this.getRecentEvents(blogId, 20)
    ]);

    return {
      metrics,
      activeVisitors,
      topPages,
      topSources,
      recentEvents,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = RealtimeAnalyticsService;
