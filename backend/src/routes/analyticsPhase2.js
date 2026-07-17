const express = require('express');
const router = express.Router();
const authorizationService = require('../services/authorization');
const Analytics = require('../models/Analytics');
const AnalyticsSession = require('../models/AnalyticsSession');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const AnalyticsGoal = require('../models/AnalyticsGoal');
const AnalyticsAlert = require('../models/AnalyticsAlert');
const AnalyticsReport = require('../models/AnalyticsReport');
const AnalyticsComparison = require('../models/AnalyticsComparison');
const AnalyticsSegment = require('../models/AnalyticsSegment');
const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
const GoogleAnalyticsData = require('../models/GoogleAnalyticsData');
const SearchConsoleData = require('../models/SearchConsoleData');
const Blog = require('../models/Blog');
const googleAnalyticsService = require('../services/googleAnalyticsService');
const searchConsoleService = require('../services/searchConsoleService');

const verifyBlogOwnership = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);

    if (!blog || blog.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.blog = blog;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/analytics/blog/:blogId/detail
// Get comprehensive blog analytics
router.get('/blog/:blogId/detail', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate, compareWithPrevious } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const [analytics, sessions, events, goals, segments] = await Promise.all([
      Analytics.find({ blogId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
      AnalyticsSession.find({ blogId, startTime: { $gte: start, $lte: end } }).limit(100),
      AnalyticsEvent.find({ blogId, timestamp: { $gte: start, $lte: end } }),
      AnalyticsGoal.find({ blogId, enabled: true }),
      AnalyticsSegment.find({ blogId, date: { $gte: start, $lte: end } })
    ]);

    const totalViews = analytics.reduce((sum, d) => sum + d.metrics.pageViews, 0);
    const totalVisitors = analytics.reduce((sum, d) => sum + d.metrics.uniqueVisitors, 0);
    const avgBounceRate = analytics.length > 0 ?
      analytics.reduce((sum, d) => sum + d.metrics.bounceRate, 0) / analytics.length : 0;

    res.json({
      blog: req.blog,
      dateRange: { start, end },
      summary: {
        totalViews,
        totalVisitors,
        avgBounceRate,
        totalSessions: sessions.length,
        totalEvents: events.length,
        totalGoals: goals.length
      },
      daily: analytics.map(d => ({
        date: d.date,
        views: d.metrics.pageViews,
        visitors: d.metrics.uniqueVisitors,
        engagementScore: d.engagementScore
      })),
      topPages: events.reduce((acc, e) => {
        const existing = acc.find(p => p.url === e.pageUrl);
        if (existing) {
          existing.events++;
        } else {
          acc.push({ url: e.pageUrl, events: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.events - a.events).slice(0, 10),
      deviceBreakdown: segments.filter(s => s.segmentType === 'device').map(s => ({
        device: s.segmentValue,
        views: s.metrics.pageViews,
        visitors: s.metrics.uniqueVisitors
      })),
      trafficSources: segments.filter(s => s.segmentType === 'traffic_source').map(s => ({
        source: s.segmentValue,
        views: s.metrics.pageViews,
        visitors: s.metrics.uniqueVisitors
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/blog/:blogId/performance
// Get deep performance metrics
router.get('/blog/:blogId/performance', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const analytics = await Analytics.find({ blogId, date: { $gte: start, $lte: end } });

    const avgMetrics = {
      pageLoadTime: analytics.reduce((sum, d) => sum + (d.performanceMetrics?.avgPageLoadTime || 0), 0) / analytics.length || 0,
      fcp: analytics.reduce((sum, d) => sum + (d.performanceMetrics?.avgFCP || 0), 0) / analytics.length || 0,
      lcp: analytics.reduce((sum, d) => sum + (d.performanceMetrics?.avgLCP || 0), 0) / analytics.length || 0,
      cls: analytics.reduce((sum, d) => sum + (d.performanceMetrics?.avgCLS || 0), 0) / analytics.length || 0,
      ttfb: analytics.reduce((sum, d) => sum + (d.performanceMetrics?.avgTTFB || 0), 0) / analytics.length || 0
    };

    res.json({
      dateRange: { start, end },
      averageMetrics: avgMetrics,
      daily: analytics.map(d => ({
        date: d.date,
        ...d.performanceMetrics
      })),
      webVitals: {
        fcp: { label: 'First Contentful Paint', value: avgMetrics.fcp, target: 1800 },
        lcp: { label: 'Largest Contentful Paint', value: avgMetrics.lcp, target: 2500 },
        cls: { label: 'Cumulative Layout Shift', value: avgMetrics.cls, target: 0.1 }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/blog/:blogId/engagement
// Get engagement deep-dive
router.get('/blog/:blogId/engagement-detail', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const [analytics, sessions, events] = await Promise.all([
      Analytics.find({ blogId, date: { $gte: start, $lte: end } }),
      AnalyticsSession.find({ blogId, startTime: { $gte: start, $lte: end } }),
      AnalyticsEvent.find({ blogId, timestamp: { $gte: start, $lte: end } })
    ]);

    const engagementScore = analytics.reduce((sum, d) => sum + d.engagementScore, 0) / analytics.length || 0;
    const avgSessionDuration = sessions.length > 0 ?
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length : 0;

    const eventTypes = {};
    events.forEach(e => {
      eventTypes[e.eventType] = (eventTypes[e.eventType] || 0) + 1;
    });

    res.json({
      dateRange: { start, end },
      metrics: {
        engagementScore,
        avgSessionDuration,
        totalSessions: sessions.length,
        bounceRate: analytics.reduce((sum, d) => sum + d.metrics.bounceRate, 0) / analytics.length || 0,
        scrollDepth: analytics.reduce((sum, d) => sum + (d.userBehavior?.avgScrollDepth || 0), 0) / analytics.length || 0
      },
      eventBreakdown: eventTypes,
      returnVisitorRate: analytics.reduce((sum, d) => sum + (d.userBehavior?.returnVisitorRate || 0), 0) / analytics.length || 0,
      daily: analytics.map(d => ({
        date: d.date,
        engagementScore: d.engagementScore,
        bounceRate: d.metrics.bounceRate,
        scrollDepth: d.userBehavior?.avgScrollDepth || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/blog/:blogId/geography
// Get geographic data
router.get('/blog/:blogId/geography', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const segments = await AnalyticsSegment.find({
      blogId,
      segmentType: 'geography',
      date: { $gte: start, $lte: end }
    });

    const geography = segments.reduce((acc, s) => {
      const existing = acc.find(g => g.country === s.segmentValue);
      if (existing) {
        existing.views += s.metrics.pageViews;
        existing.visitors += s.metrics.uniqueVisitors;
      } else {
        acc.push({
          country: s.segmentValue,
          views: s.metrics.pageViews,
          visitors: s.metrics.uniqueVisitors,
          bounceRate: s.metrics.bounceRate
        });
      }
      return acc;
    }, []).sort((a, b) => b.views - a.views);

    res.json({
      dateRange: { start, end },
      countries: geography.slice(0, 50),
      total: geography.reduce((sum, g) => sum + g.views, 0),
      topCountry: geography[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/blog/:blogId/referrers
// Get referrer analysis
router.get('/blog/:blogId/referrers', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const segments = await AnalyticsSegment.find({
      blogId,
      segmentType: 'traffic_source',
      date: { $gte: start, $lte: end }
    });

    const referrers = segments.reduce((acc, s) => {
      const existing = acc.find(r => r.source === s.segmentValue);
      if (existing) {
        existing.views += s.metrics.pageViews;
        existing.visitors += s.metrics.uniqueVisitors;
      } else {
        acc.push({
          source: s.segmentValue,
          views: s.metrics.pageViews,
          visitors: s.metrics.uniqueVisitors,
          bounceRate: s.metrics.bounceRate
        });
      }
      return acc;
    }, []).sort((a, b) => b.views - a.views);

    res.json({
      dateRange: { start, end },
      referrers,
      total: referrers.reduce((sum, r) => sum + r.views, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/blog/:blogId/growth
// Get growth comparison
router.get('/blog/:blogId/growth', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { days = 30 } = req.query;

    const currentEnd = new Date();
    const currentStart = new Date(currentEnd.getTime() - days * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      Analytics.find({ blogId, date: { $gte: currentStart, $lte: currentEnd } }),
      Analytics.find({ blogId, date: { $gte: previousStart, $lte: previousEnd } })
    ]);

    const currentMetrics = {
      views: current.reduce((sum, d) => sum + d.metrics.pageViews, 0),
      visitors: current.reduce((sum, d) => sum + d.metrics.uniqueVisitors, 0),
      engagement: current.reduce((sum, d) => sum + d.engagementScore, 0) / current.length || 0
    };

    const previousMetrics = {
      views: previous.reduce((sum, d) => sum + d.metrics.pageViews, 0),
      visitors: previous.reduce((sum, d) => sum + d.metrics.uniqueVisitors, 0),
      engagement: previous.reduce((sum, d) => sum + d.engagementScore, 0) / previous.length || 0
    };

    const growth = {
      views: previousMetrics.views > 0 ? ((currentMetrics.views - previousMetrics.views) / previousMetrics.views * 100).toFixed(2) : 0,
      visitors: previousMetrics.visitors > 0 ? ((currentMetrics.visitors - previousMetrics.visitors) / previousMetrics.visitors * 100).toFixed(2) : 0,
      engagement: previousMetrics.engagement > 0 ? ((currentMetrics.engagement - previousMetrics.engagement) / previousMetrics.engagement * 100).toFixed(2) : 0
    };

    res.json({
      period: { days, currentStart, currentEnd, previousStart, previousEnd },
      current: currentMetrics,
      previous: previousMetrics,
      growth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/compare
// Compare multiple blogs
router.post('/compare', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogIds, startDate, endDate } = req.body;

    if (!blogIds || blogIds.length === 0) {
      return res.status(400).json({ error: 'blogIds required' });
    }

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const comparison = new AnalyticsComparison({
      comparisonId: `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientId: req.user.clientId,
      blogs: blogIds,
      dateRange: { startDate: start, endDate: end },
      createdBy: req.user._id
    });

    const blogAnalytics = await Promise.all(
      blogIds.map(async (blogId) => {
        const blog = await Blog.findById(blogId);
        const analytics = await Analytics.find({ blogId, date: { $gte: start, $lte: end } });

        return {
          blogId,
          blogTitle: blog?.title || 'Unknown',
          metrics: {
            pageViews: analytics.reduce((sum, d) => sum + d.metrics.pageViews, 0),
            uniqueVisitors: analytics.reduce((sum, d) => sum + d.metrics.uniqueVisitors, 0),
            bounceRate: analytics.length > 0 ? analytics.reduce((sum, d) => sum + d.metrics.bounceRate, 0) / analytics.length : 0,
            engagementScore: analytics.length > 0 ? analytics.reduce((sum, d) => sum + d.engagementScore, 0) / analytics.length : 0
          }
        };
      })
    );

    comparison.comparisonData = blogAnalytics.map((d, i) => ({ ...d, rank: i + 1 }));
    await comparison.save();

    res.json({ success: true, comparisonId: comparison.comparisonId, data: comparison });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/goals/:blogId
// Get goals for blog
router.get('/goals/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const goals = await AnalyticsGoal.find({ blogId, enabled: true }).sort({ createdAt: -1 });

    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/goals/:blogId
// Create goal
router.post('/goals/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, description, type, config, value } = req.body;

    const goal = new AnalyticsGoal({
      goalId: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blogId,
      clientId: req.user.clientId,
      name,
      description,
      type,
      config,
      value,
      createdBy: req.user._id
    });

    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/alerts/:blogId
// Get alerts for blog
router.get('/alerts/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const alerts = await AnalyticsAlert.find({ blogId }).sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/alerts/:blogId
// Create alert
router.post('/alerts/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, description, metric, condition, threshold, recipients } = req.body;

    const alert = new AnalyticsAlert({
      alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blogId,
      clientId: req.user.clientId,
      name,
      description,
      metric,
      condition,
      threshold,
      recipients,
      createdBy: req.user._id
    });

    await alert.save();
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/reports/:blogId
// Get reports
router.get('/reports/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const reports = await AnalyticsReport.find({ blogId }).sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/reports/:blogId
// Create report
router.post('/reports/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, description, type, metrics, schedule, emailRecipients } = req.body;

    const report = new AnalyticsReport({
      reportId: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blogId,
      clientId: req.user.clientId,
      name,
      description,
      type,
      metrics,
      schedule,
      emailRecipients,
      createdBy: req.user._id
    });

    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/google/auth-url
// Get Google Analytics auth URL
router.get('/google/auth-url', authorizationService.requireAuth, async (req, res) => {
  try {
    const state = Math.random().toString(36).substr(2, 9);
    res.json({ authUrl: await googleAnalyticsService.getAuthUrl(state) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/google/connect
// Connect Google Analytics
router.post('/google/connect', authorizationService.requireAuth, async (req, res) => {
  try {
    const { code, blogId } = req.body;

    if (!code) return res.status(400).json({ error: 'code required' });

    const tokens = await googleAnalyticsService.exchangeCodeForToken(code);
    const properties = await googleAnalyticsService.getProperties(tokens.access_token);

    const config = new GoogleAnalyticsConfig({
      configId: `ga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientId: req.user.clientId,
      blogId,
      connectionStatus: 'connected',
      oauth: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope.split(' ')
      },
      connectedBy: req.user._id
    });

    await config.save();
    res.json({ success: true, config, properties });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/google/sync/:configId
// Sync Google Analytics data
router.post('/google/sync/:configId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { configId } = req.params;
    const result = await googleAnalyticsService.syncData(configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/google/data/:blogId
// Get synced Google Analytics data
router.get('/google/data/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await GoogleAnalyticsData.find({ blogId, date: { $gte: startDate } }).sort({ date: -1 });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/search-console/sync
// Sync Search Console data
router.post('/search-console/sync', authorizationService.requireAuth, async (req, res) => {
  try {
    const { siteUrl, blogId } = req.body;

    if (!siteUrl || !blogId) {
      return res.status(400).json({ error: 'siteUrl and blogId required' });
    }

    const config = await GoogleAnalyticsConfig.findOne({ blogId }).select('+oauth.accessToken');

    if (!config || !config.oauth.accessToken) {
      return res.status(400).json({ error: 'Google OAuth not configured' });
    }

    const result = await searchConsoleService.syncData(
      siteUrl,
      config.oauth.accessToken,
      blogId,
      req.user.clientId
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/search-console/data/:blogId
// Get synced Search Console data
router.get('/search-console/data/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await SearchConsoleData.find({ blogId, date: { $gte: startDate } }).sort({ date: -1 });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/export/:blogId
// Export analytics as CSV
router.get('/export/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const analytics = await Analytics.find({ blogId, date: { $gte: start, $lte: end } }).sort({ date: 1 });

    if (format === 'csv') {
      const csv = ['date,pageViews,uniqueVisitors,bounceRate,engagementScore'];
      analytics.forEach(d => {
        csv.push(`${d.date.toISOString().split('T')[0]},${d.metrics.pageViews},${d.metrics.uniqueVisitors},${d.metrics.bounceRate},${d.engagementScore}`);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${blogId}.csv"`);
      res.send(csv.join('\n'));
    } else {
      res.json({ data: analytics });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
