const Analytics = require('../models/Analytics');
const Blog = require('../models/Blog');

class AnalyticsService {
  async recordPageView(blogId, sourceData = {}) {
    try {
      const {
        source = 'direct',
        device = 'desktop',
        country = 'unknown',
        referrer = null
      } = sourceData;

      await Analytics.recordPageView(blogId, source, device, country);

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to record page view: ${error.message}`);
    }
  }

  async getBlogAnalytics(blogId, startDate, endDate) {
    try {
      const blog = await Blog.findById(blogId);

      if (!blog) {
        throw new Error('Blog not found');
      }

      const metrics = await Analytics.getMetricsForBlog(blogId, startDate, endDate);
      const trend = await Analytics.getDailyTrend(blogId, 30);
      const topReferrers = await this.getTopReferrers(blogId, startDate, endDate);

      return {
        blog: {
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          status: blog.status,
          publishedAt: blog.publishedAt
        },
        period: { startDate, endDate },
        aggregated: metrics[0] || {
          totalViews: 0,
          totalVisitors: 0,
          avgBounceRate: 0,
          avgTimeOnPage: 0,
          totalClicks: 0,
          totalShares: 0,
          totalComments: 0,
          totalLikes: 0,
          avgScrollDepth: 0
        },
        trend,
        topReferrers
      };
    } catch (error) {
      throw new Error(`Failed to get blog analytics: ${error.message}`);
    }
  }

  async getTopPerformingBlogs(limit = 10, days = 30) {
    try {
      const topBlogs = await Analytics.getTopPerformingBlogs(limit, days);

      return topBlogs.map(item => ({
        blogId: item._id,
        title: item.blog.title,
        slug: item.blog.slug,
        totalViews: item.totalViews,
        totalVisitors: item.totalVisitors,
        avgEngagement: item.avgEngagement,
        totalShares: item.totalShares,
        engagementRate: ((item.avgEngagement / item.totalViews) * 100).toFixed(2)
      }));
    } catch (error) {
      throw new Error(`Failed to get top performing blogs: ${error.message}`);
    }
  }

  async getDashboardSummary(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const allMetrics = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$metrics.pageViews' },
            totalVisitors: { $sum: '$metrics.uniqueVisitors' },
            avgBounceRate: { $avg: '$metrics.bounceRate' },
            totalShares: { $sum: '$metrics.socialShares' },
            totalComments: { $sum: '$metrics.comments' },
            avgTimeOnPage: { $avg: '$metrics.avgTimeOnPage' }
          }
        }
      ]);

      const trafficSourceBreakdown = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            organic: { $sum: '$trafficSources.organic' },
            direct: { $sum: '$trafficSources.direct' },
            referral: { $sum: '$trafficSources.referral' },
            social: { $sum: '$trafficSources.social' },
            email: { $sum: '$trafficSources.email' },
            paid: { $sum: '$trafficSources.paid' }
          }
        }
      ]);

      const deviceBreakdown = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            desktop: { $sum: '$deviceBreakdown.desktop' },
            mobile: { $sum: '$deviceBreakdown.mobile' },
            tablet: { $sum: '$deviceBreakdown.tablet' }
          }
        }
      ]);

      const totalBlogs = await Blog.countDocuments({ status: 'published' });

      return {
        period: { days, startDate },
        summary: allMetrics[0] || {
          totalViews: 0,
          totalVisitors: 0,
          avgBounceRate: 0,
          totalShares: 0,
          totalComments: 0,
          avgTimeOnPage: 0
        },
        trafficSources: trafficSourceBreakdown[0] || {
          organic: 0,
          direct: 0,
          referral: 0,
          social: 0,
          email: 0,
          paid: 0
        },
        devices: deviceBreakdown[0] || {
          desktop: 0,
          mobile: 0,
          tablet: 0
        },
        totalPublishedBlogs: totalBlogs
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard summary: ${error.message}`);
    }
  }

  async getTopReferrers(blogId, startDate, endDate) {
    try {
      const referrers = await Analytics.aggregate([
        {
          $match: {
            blogId: require('mongoose').Types.ObjectId(blogId),
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $unwind: '$referrers'
        },
        {
          $group: {
            _id: '$referrers.source',
            totalViews: { $sum: '$referrers.views' },
            totalClicks: { $sum: '$referrers.clickThroughs' }
          }
        },
        {
          $sort: { totalViews: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return referrers.map(ref => ({
        source: ref._id,
        views: ref.totalViews,
        clickThroughs: ref.totalClicks,
        conversionRate: ((ref.totalClicks / ref.totalViews) * 100).toFixed(2)
      }));
    } catch (error) {
      throw new Error(`Failed to get top referrers: ${error.message}`);
    }
  }

  async getGeographicData(blogId, startDate, endDate) {
    try {
      const geoData = await Analytics.aggregate([
        {
          $match: {
            blogId: require('mongoose').Types.ObjectId(blogId),
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $unwind: '$geography'
        },
        {
          $group: {
            _id: '$geography.country',
            totalViews: { $sum: '$geography.views' },
            totalVisitors: { $sum: '$geography.visitors' }
          }
        },
        {
          $sort: { totalViews: -1 }
        },
        {
          $limit: 15
        }
      ]);

      return geoData;
    } catch (error) {
      throw new Error(`Failed to get geographic data: ${error.message}`);
    }
  }

  async getSearchTermsPerformance(blogId, startDate, endDate) {
    try {
      const searchTerms = await Analytics.aggregate([
        {
          $match: {
            blogId: require('mongoose').Types.ObjectId(blogId),
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $unwind: '$searchTerms'
        },
        {
          $group: {
            _id: '$searchTerms.term',
            impressions: { $sum: '$searchTerms.impressions' },
            clicks: { $sum: '$searchTerms.clicks' },
            avgPosition: { $avg: '$searchTerms.avgPosition' }
          }
        },
        {
          $sort: { impressions: -1 }
        },
        {
          $limit: 20
        }
      ]);

      return searchTerms.map(term => ({
        term: term._id,
        impressions: term.impressions,
        clicks: term.clicks,
        avgPosition: term.avgPosition.toFixed(1),
        ctr: ((term.clicks / term.impressions) * 100).toFixed(2)
      }));
    } catch (error) {
      throw new Error(`Failed to get search terms performance: ${error.message}`);
    }
  }

  async compareBlogs(blogIds, startDate, endDate) {
    try {
      const comparison = await Promise.all(
        blogIds.map(blogId => this.getBlogAnalytics(blogId, startDate, endDate))
      );

      return comparison;
    } catch (error) {
      throw new Error(`Failed to compare blogs: ${error.message}`);
    }
  }

  async getGrowthMetrics(blogId, days = 30) {
    try {
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days * 2);
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

      const current = await Analytics.getMetricsForBlog(blogId, currentPeriodStart, new Date());
      const previous = await Analytics.getMetricsForBlog(blogId, previousPeriodStart, previousPeriodEnd);

      const currentMetrics = current[0] || { totalViews: 0, totalVisitors: 0, totalClicks: 0 };
      const previousMetrics = previous[0] || { totalViews: 0, totalVisitors: 0, totalClicks: 0 };

      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return (((current - previous) / previous) * 100).toFixed(2);
      };

      return {
        views: {
          current: currentMetrics.totalViews,
          previous: previousMetrics.totalViews,
          growth: calculateGrowth(currentMetrics.totalViews, previousMetrics.totalViews)
        },
        visitors: {
          current: currentMetrics.totalVisitors,
          previous: previousMetrics.totalVisitors,
          growth: calculateGrowth(currentMetrics.totalVisitors, previousMetrics.totalVisitors)
        },
        engagement: {
          current: currentMetrics.totalClicks || 0,
          previous: previousMetrics.totalClicks || 0,
          growth: calculateGrowth(currentMetrics.totalClicks || 0, previousMetrics.totalClicks || 0)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get growth metrics: ${error.message}`);
    }
  }
}

module.exports = new AnalyticsService();
