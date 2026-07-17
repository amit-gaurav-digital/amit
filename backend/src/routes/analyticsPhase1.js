const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Analytics = require('../models/Analytics');
const AnalyticsSession = require('../models/AnalyticsSession');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Blog = require('../models/Blog');

// Middleware to verify blog ownership
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

// GET /api/analytics/dashboard/:blogId
// Get analytics dashboard data
router.get('/dashboard/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const [
      analyticsData,
      engagementMetrics,
      performanceMetrics,
      sessionsAnalysis,
      topPages
    ] = await Promise.all([
      Analytics.find(
        { blogId, date: { $gte: start, $lte: end } },
        null,
        { sort: { date: -1 } }
      ).limit(30),
      Analytics.getEngagementMetrics(blogId, start, end),
      Analytics.getPerformanceMetrics(blogId, start, end),
      AnalyticsSession.getSessionAnalysis(blogId, start, end),
      AnalyticsEvent.getEventsByPage(blogId, start, end)
    ]);

    const summary = {
      dateRange: { start, end },
      totalViews: analyticsData.reduce((sum, d) => sum + d.metrics.pageViews, 0),
      totalVisitors: analyticsData.reduce((sum, d) => sum + d.metrics.uniqueVisitors, 0),
      avgEngagementScore: analyticsData.reduce((sum, d) => sum + d.engagementScore, 0) / analyticsData.length || 0,
      avgBounceRate: analyticsData.reduce((sum, d) => sum + d.metrics.bounceRate, 0) / analyticsData.length || 0,
      topPages: topPages.slice(0, 10),
      engagementMetrics: engagementMetrics[0] || {},
      performanceMetrics: performanceMetrics[0] || {},
      sessionsAnalysis: sessionsAnalysis[0] || {},
      dailyTrend: analyticsData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        views: d.metrics.pageViews,
        visitors: d.metrics.uniqueVisitors,
        engagementScore: d.engagementScore,
        bounceRate: d.metrics.bounceRate
      }))
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/realtime/:blogId
// Get real-time metrics
router.get('/realtime/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const realtimeService = req.app.locals.realtimeAnalytics;

    if (!realtimeService) {
      return res.status(503).json({ error: 'Real-time analytics not available' });
    }

    const liveData = await realtimeService.getLiveDashboard(blogId);
    res.json(liveData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/event/:blogId
// Track custom analytics event
router.post('/event/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const { sessionId, eventData } = req.body;

    if (!sessionId || !eventData) {
      return res.status(400).json({ error: 'sessionId and eventData required' });
    }

    const event = await AnalyticsEvent.recordEvent(blogId, sessionId, eventData);
    const realtimeService = req.app.locals.realtimeAnalytics;

    if (realtimeService) {
      await realtimeService.trackEvent(blogId, eventData);
    }

    res.json({ success: true, eventId: event.eventId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/session/:blogId/start
// Start a new session
router.post('/session/:blogId/start', async (req, res) => {
  try {
    const { blogId } = req.params;
    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({ error: 'sessionData required' });
    }

    const sessionId = `${blogId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session = new AnalyticsSession({
      blogId,
      sessionId,
      ...sessionData,
      startTime: new Date()
    });

    await session.save();

    const realtimeService = req.app.locals.realtimeAnalytics;
    if (realtimeService) {
      await realtimeService.startSession(blogId, sessionId, sessionData);
    }

    res.json({ sessionId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analytics/session/:blogId/:sessionId/end
// End a session
router.post('/session/:blogId/:sessionId/end', async (req, res) => {
  try {
    const { blogId, sessionId } = req.params;
    const { endData } = req.body;

    const session = await AnalyticsSession.findOneAndUpdate(
      { sessionId },
      {
        endTime: new Date(),
        duration: endData?.duration || 0,
        ...endData
      },
      { new: true }
    );

    const realtimeService = req.app.locals.realtimeAnalytics;
    if (realtimeService) {
      await realtimeService.endSession(blogId, sessionId);
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/hourly/:blogId
// Get hourly breakdown for a specific date
router.get('/hourly/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { date } = req.query;

    const targetDate = new Date(date || new Date());
    targetDate.setHours(0, 0, 0, 0);

    const analytics = await Analytics.getHourlyBreakdown(blogId, targetDate);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      hourlyMetrics: analytics?.hourlyMetrics || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/engagement/:blogId
// Get detailed engagement metrics
router.get('/engagement/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const [
      engagementMetrics,
      sessionAnalysis,
      sessionsBySource
    ] = await Promise.all([
      Analytics.getEngagementMetrics(blogId, start, end),
      AnalyticsSession.getSessionAnalysis(blogId, start, end),
      AnalyticsSession.getSessionsBySource(blogId, start, end)
    ]);

    res.json({
      analytics: engagementMetrics[0] || {},
      sessions: sessionAnalysis[0] || {},
      bySource: sessionsBySource
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/performance/:blogId
// Get performance metrics
router.get('/performance/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const performanceMetrics = await Analytics.getPerformanceMetrics(blogId, start, end);

    res.json({
      performance: performanceMetrics[0] || {},
      dateRange: { start, end }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/events/:blogId
// Get event summary
router.get('/events/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const [
      eventSummary,
      conversionEvents,
      eventsByPage
    ] = await Promise.all([
      AnalyticsEvent.getEventSummary(blogId, start, end),
      AnalyticsEvent.getConversionEvents(blogId, start, end),
      AnalyticsEvent.getEventsByPage(blogId, start, end)
    ]);

    res.json({
      summary: eventSummary,
      conversions: conversionEvents,
      byPage: eventsByPage,
      dateRange: { start, end }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/sessions/:blogId
// Get sessions list (paginated)
router.get('/sessions/:blogId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      AnalyticsSession.find(
        { blogId, startTime: { $gte: start, $lte: end } },
        null,
        { skip, limit, sort: { startTime: -1 } }
      ),
      AnalyticsSession.countDocuments({ blogId, startTime: { $gte: start, $lte: end } })
    ]);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/sessions/:blogId/:sessionId
// Get single session details
router.get('/sessions/:blogId/:sessionId', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [session, events] = await Promise.all([
      AnalyticsSession.findOne({ sessionId }),
      AnalyticsEvent.find({ sessionId }).sort({ timestamp: 1 })
    ]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session,
      events,
      eventCount: events.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/trends/:blogId/:metric
// Get trend for specific metric
router.get('/trends/:blogId/:metric', authenticate, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId, metric } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trend = await Analytics.aggregate([
      {
        $match: {
          blogId: require('mongoose').Types.ObjectId(blogId),
          date: { $gte: startDate }
        }
      },
      {
        $sort: { date: 1 }
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          value: metric.startsWith('metrics.') ? `$${metric}` : `$${metric}`
        }
      }
    ]);

    // Calculate trend direction
    if (trend.length >= 2) {
      const firstValue = trend[0].value;
      const lastValue = trend[trend.length - 1].value;
      const direction = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
      const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;

      res.json({
        metric,
        trend,
        direction,
        changePercent: parseFloat(changePercent.toFixed(2)),
        days: parseInt(days)
      });
    } else {
      res.json({ metric, trend, direction: 'stable', changePercent: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
