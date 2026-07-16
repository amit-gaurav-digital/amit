const express = require('express');
const authorizationService = require('../services/authorization');
const analyticsService = require('../services/analytics');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.post('/page-view/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const { source, device, country, referrer } = req.body;

    await analyticsService.recordPageView(blogId, {
      source,
      device,
      country,
      referrer
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/dashboard', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const summary = await analyticsService.getDashboardSummary(parseInt(days));

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const analytics = await analyticsService.getBlogAnalytics(blogId, startDate, endDate);

    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/top-performing', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const topBlogs = await analyticsService.getTopPerformingBlogs(parseInt(limit), parseInt(days));

    res.json(topBlogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId/referrers', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const referrers = await analyticsService.getTopReferrers(blogId, startDate, endDate);

    res.json(referrers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId/geography', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const geoData = await analyticsService.getGeographicData(blogId, startDate, endDate);

    res.json(geoData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId/search-terms', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const searchTerms = await analyticsService.getSearchTermsPerformance(blogId, startDate, endDate);

    res.json(searchTerms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId/growth', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { days = 30 } = req.query;

    const growth = await analyticsService.getGrowthMetrics(blogId, parseInt(days));

    res.json(growth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/compare', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogIds, startDate, endDate } = req.body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ error: 'blogIds array is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const comparison = await analyticsService.compareBlogs(blogIds, startDate, endDate);

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/:blogId', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const analytics = await analyticsService.getBlogAnalytics(blogId, startDate, endDate);

    const csvContent = generateCSV(analytics);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${blogId}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateCSV(analytics) {
  const { blog, aggregated, trend } = analytics;

  let csv = 'Blog Analytics Report\n';
  csv += `Blog: ${blog.title}\n`;
  csv += `Period: ${analytics.period.startDate} to ${analytics.period.endDate}\n\n`;

  csv += 'Summary Metrics\n';
  csv += 'Metric,Value\n';
  csv += `Total Page Views,${aggregated.totalViews}\n`;
  csv += `Total Visitors,${aggregated.totalVisitors}\n`;
  csv += `Bounce Rate,${aggregated.avgBounceRate.toFixed(2)}%\n`;
  csv += `Avg Time on Page,${aggregated.avgTimeOnPage.toFixed(2)}s\n`;
  csv += `Total Clicks,${aggregated.totalClicks}\n`;
  csv += `Total Shares,${aggregated.totalShares}\n`;
  csv += `Total Comments,${aggregated.totalComments}\n`;
  csv += `Total Likes,${aggregated.totalLikes}\n\n`;

  csv += 'Daily Trend\n';
  csv += 'Date,Page Views,Unique Visitors,Bounce Rate,Avg Time on Page,Click Throughs\n';
  trend.forEach(day => {
    csv += `${day.date},${day.pageViews},${day.uniqueVisitors},${day.bounceRate.toFixed(2)},${day.avgTimeOnPage.toFixed(2)},${day.clickThroughs}\n`;
  });

  return csv;
}

module.exports = router;
