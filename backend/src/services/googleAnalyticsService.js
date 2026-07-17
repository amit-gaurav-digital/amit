const axios = require('axios');
const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
const GoogleAnalyticsData = require('../models/GoogleAnalyticsData');

class GoogleAnalyticsService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/analytics/google/callback';
  }

  async getAuthUrl(state) {
    const scope = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics'
    ];

    return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scope.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    }).toString()}`;
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      });

      return response.data;
    } catch (error) {
      throw new Error(`OAuth exchange failed: ${error.message}`);
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async getProperties(accessToken) {
    try {
      const response = await axios.get(
        'https://analyticsadmin.googleapis.com/v1beta/properties',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data.properties || [];
    } catch (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }
  }

  async fetchRealtimeData(accessToken, propertyId) {
    try {
      const response = await axios.post(
        `https://analyticsreporting.googleapis.com/v4/reports:batchGet`,
        {
          reportRequests: [{
            viewId: propertyId,
            dateRanges: [{ startDate: 'today', endDate: 'today' }],
            metrics: [
              { expression: 'ga:sessions' },
              { expression: 'ga:users' },
              { expression: 'ga:pageviews' }
            ],
            dimensions: [
              { name: 'ga:pagePath' },
              { name: 'ga:country' },
              { name: 'ga:source' }
            ]
          }]
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return this.parseRealtimeReport(response.data);
    } catch (error) {
      console.error('Realtime data fetch error:', error.message);
      return null;
    }
  }

  async fetchDailyData(accessToken, propertyId, startDate, endDate) {
    try {
      const response = await axios.post(
        `https://analyticsreporting.googleapis.com/v4/reports:batchGet`,
        {
          reportRequests: [{
            viewId: propertyId,
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { expression: 'ga:pageviews' },
              { expression: 'ga:users' },
              { expression: 'ga:bounceRate' },
              { expression: 'ga:avgSessionDuration' },
              { expression: 'ga:goalConversionRateAll' },
              { expression: 'ga:pageLoadTime' }
            ],
            dimensions: [{ name: 'ga:date' }]
          }]
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return this.parseDailyReport(response.data);
    } catch (error) {
      console.error('Daily data fetch error:', error.message);
      return null;
    }
  }

  async fetchTrafficChannels(accessToken, propertyId, startDate, endDate) {
    try {
      const response = await axios.post(
        `https://analyticsreporting.googleapis.com/v4/reports:batchGet`,
        {
          reportRequests: [{
            viewId: propertyId,
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { expression: 'ga:pageviews' },
              { expression: 'ga:users' },
              { expression: 'ga:bounceRate' }
            ],
            dimensions: [{ name: 'ga:channelGrouping' }]
          }]
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return this.parseChannelReport(response.data);
    } catch (error) {
      console.error('Traffic channels fetch error:', error.message);
      return null;
    }
  }

  parseRealtimeReport(data) {
    const report = data.reports?.[0];
    if (!report?.data?.rows) return { activeUsers: 0, topPages: [], topCountries: [], topSources: [] };

    const activeUsers = report.data.totals?.[0]?.values?.[0] || 0;
    return { activeUsers, topPages: [], topCountries: [], topSources: [] };
  }

  parseDailyReport(data) {
    const report = data.reports?.[0];
    if (!report?.data?.rows) return null;

    return report.data.rows.map(row => ({
      date: row.dimensions[0],
      pageViews: parseInt(row.metrics[0].values[0]) || 0,
      users: parseInt(row.metrics[1].values[0]) || 0,
      bounceRate: parseFloat(row.metrics[2].values[0]) || 0,
      avgSessionDuration: parseFloat(row.metrics[3].values[0]) || 0,
      conversionRate: parseFloat(row.metrics[4].values[0]) || 0,
      pageLoadTime: parseFloat(row.metrics[5].values[0]) || 0
    }));
  }

  parseChannelReport(data) {
    const report = data.reports?.[0];
    if (!report?.data?.rows) return {};

    const channels = {
      organic: { views: 0, users: 0, bounceRate: 0 },
      direct: { views: 0, users: 0, bounceRate: 0 },
      referral: { views: 0, users: 0, bounceRate: 0 },
      social: { views: 0, users: 0, bounceRate: 0 },
      email: { views: 0, users: 0, bounceRate: 0 },
      paid: { views: 0, users: 0, bounceRate: 0 }
    };

    report.data.rows.forEach(row => {
      const channel = row.dimensions[0].toLowerCase();
      if (channels[channel]) {
        channels[channel] = {
          views: parseInt(row.metrics[0].values[0]) || 0,
          users: parseInt(row.metrics[1].values[0]) || 0,
          bounceRate: parseFloat(row.metrics[2].values[0]) || 0
        };
      }
    });

    return channels;
  }

  async syncData(configId) {
    try {
      const config = await GoogleAnalyticsConfig.findById(configId).select('+oauth.accessToken +oauth.refreshToken');
      if (!config) throw new Error('Config not found');

      let accessToken = config.oauth.accessToken;

      if (new Date() > config.oauth.expiresAt) {
        const tokens = await this.refreshAccessToken(config.oauth.refreshToken);
        accessToken = tokens.access_token;
        config.oauth.accessToken = accessToken;
        config.oauth.expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        await config.save();
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [realtime, daily, channels] = await Promise.all([
        this.fetchRealtimeData(accessToken, config.gaAccountInfo.propertyId),
        this.fetchDailyData(accessToken, config.gaAccountInfo.propertyId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]),
        this.fetchTrafficChannels(accessToken, config.gaAccountInfo.propertyId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0])
      ]);

      if (daily) {
        for (const dayData of daily) {
          await GoogleAnalyticsData.updateOne(
            { blogId: config.blogId, date: dayData.date },
            {
              $set: {
                daily: {
                  screenPageViews: dayData.pageViews,
                  activeUsers: dayData.users,
                  bounceRate: dayData.bounceRate,
                  averageSessionDuration: dayData.avgSessionDuration,
                  conversionRate: dayData.conversionRate
                },
                trafficChannels: channels,
                syncStatus: { syncedAt: new Date() }
              }
            },
            { upsert: true }
          );
        }
      }

      config.syncSettings.lastSyncAt = new Date();
      config.syncSettings.nextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      config.syncSettings.syncStatus = 'completed';
      await config.save();

      return { success: true, syncedAt: new Date() };
    } catch (error) {
      console.error('Sync failed:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleAnalyticsService();
