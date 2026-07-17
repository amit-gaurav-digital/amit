const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
const GoogleAnalyticsData = require('../models/GoogleAnalyticsData');
const SearchConsoleData = require('../models/SearchConsoleData');
const googleAnalyticsService = require('./googleAnalyticsService');
const searchConsoleService = require('./searchConsoleService');
const encryptionService = require('./encryptionService');

class IntegrationManager {
  constructor() {
    this.syncIntervals = new Map();
  }

  /**
   * Connect Google Analytics for a blog
   */
  async connectGoogleAnalytics(clientId, blogId, tokens, gaAccountInfo) {
    try {
      let config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        config = new GoogleAnalyticsConfig({
          configId: `ga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clientId,
          blogId,
          connectionStatus: 'connected'
        });
      }

      // Encrypt and store tokens
      config.oauth = {
        accessToken: encryptionService.encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptionService.encrypt(tokens.refresh_token) : null,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope?.split(' ') || []
      };

      config.gaAccountInfo = gaAccountInfo;
      config.connectionStatus = 'connected';
      config.syncSettings.enabled = true;
      config.syncSettings.nextSyncAt = new Date(Date.now() + 60000); // Sync in 1 minute

      await config.save();

      // Start automatic sync
      this.startAutoSync(config._id);

      return { success: true, config };
    } catch (error) {
      console.error('GA connection error:', error.message);
      throw error;
    }
  }

  /**
   * Connect Search Console for a blog
   */
  async connectSearchConsole(clientId, blogId, siteUrl, accessToken) {
    try {
      // Verify site URL is valid
      if (!siteUrl.startsWith('http')) {
        throw new Error('Invalid site URL. Must start with http:// or https://');
      }

      // Store encrypted access token in GA config (they share auth)
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('Please connect Google Analytics first');
      }

      // Mark SC as enabled
      config.syncSettings.scEnabled = true;
      config.scSiteUrl = siteUrl;
      config.syncSettings.scNextSyncAt = new Date(Date.now() + 60000);

      await config.save();

      return { success: true, connected: true };
    } catch (error) {
      console.error('SC connection error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect Google Analytics
   */
  async disconnectGoogleAnalytics(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('No GA configuration found');
      }

      config.connectionStatus = 'disconnected';
      config.oauth.accessToken = null;
      config.oauth.refreshToken = null;
      config.syncSettings.enabled = false;
      config.disconnectedAt = new Date();

      await config.save();

      // Stop auto sync
      this.stopAutoSync(config._id);

      return { success: true };
    } catch (error) {
      console.error('GA disconnection error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect Search Console
   */
  async disconnectSearchConsole(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('No configuration found');
      }

      config.syncSettings.scEnabled = false;
      config.scSiteUrl = null;

      await config.save();

      return { success: true };
    } catch (error) {
      console.error('SC disconnection error:', error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('-oauth.accessToken -oauth.refreshToken');

      if (!config) {
        return {
          googleAnalytics: { connected: false },
          searchConsole: { connected: false }
        };
      }

      return {
        googleAnalytics: {
          connected: config.connectionStatus === 'connected',
          status: config.connectionStatus,
          propertyId: config.gaAccountInfo?.propertyId,
          propertyName: config.gaAccountInfo?.propertyName,
          lastSync: config.syncSettings.lastSyncAt,
          nextSync: config.syncSettings.nextSyncAt,
          syncStatus: config.syncSettings.syncStatus
        },
        searchConsole: {
          connected: config.syncSettings.scEnabled || false,
          siteUrl: config.scSiteUrl,
          lastSync: config.syncSettings.scLastSyncAt,
          nextSync: config.syncSettings.scNextSyncAt
        }
      };
    } catch (error) {
      console.error('Status check error:', error.message);
      throw error;
    }
  }

  /**
   * Sync Google Analytics data
   */
  async syncGoogleAnalyticsData(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('+oauth.accessToken +oauth.refreshToken');

      if (!config || config.connectionStatus !== 'connected') {
        throw new Error('GA not connected');
      }

      // Check if token is expired
      if (new Date() > config.oauth.expiresAt) {
        await this.refreshGoogleAnalyticsToken(config);
      }

      // Decrypt token
      const accessToken = encryptionService.decrypt(config.oauth.accessToken);

      // Get last sync date or default to 30 days ago
      const lastSync = config.syncSettings.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const startDate = lastSync.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      // Fetch data from Google Analytics
      const [realtime, daily, channels, geography] = await Promise.all([
        googleAnalyticsService.fetchRealtimeData(accessToken, config.gaAccountInfo.propertyId).catch(() => null),
        googleAnalyticsService.fetchDailyData(accessToken, config.gaAccountInfo.propertyId, startDate, endDate).catch(() => null),
        googleAnalyticsService.fetchTrafficChannels(accessToken, config.gaAccountInfo.propertyId, startDate, endDate).catch(() => null),
        this.fetchGeographyData(accessToken, config.gaAccountInfo.propertyId, startDate, endDate).catch(() => null)
      ]);

      // Store data
      if (daily) {
        for (const dayData of daily) {
          await GoogleAnalyticsData.updateOne(
            { blogId, date: dayData.date },
            {
              $set: {
                clientId,
                propertyId: config.gaAccountInfo.propertyId,
                daily: {
                  screenPageViews: dayData.pageViews,
                  activeUsers: dayData.users,
                  bounceRate: dayData.bounceRate,
                  averageSessionDuration: dayData.avgSessionDuration,
                  conversionRate: dayData.conversionRate
                },
                realtime: realtime || {},
                trafficChannels: channels || {},
                geography: geography || [],
                syncStatus: { syncedAt: new Date() }
              }
            },
            { upsert: true }
          );
        }
      }

      // Update config
      config.syncSettings.lastSyncAt = new Date();
      config.syncSettings.nextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      config.syncSettings.syncStatus = 'completed';
      config.syncSettings.syncErrors = [];

      await config.save();

      return {
        success: true,
        recordsSynced: daily?.length || 0,
        syncedAt: new Date()
      };
    } catch (error) {
      console.error('GA sync error:', error.message);

      // Update sync error
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });
      if (config) {
        config.syncSettings.syncStatus = 'failed';
        config.syncSettings.syncErrors.push({
          timestamp: new Date(),
          error: error.message
        });
        config.syncSettings.nextSyncAt = new Date(Date.now() + 60 * 60 * 1000); // Retry in 1 hour
        await config.save();
      }

      throw error;
    }
  }

  /**
   * Sync Search Console data
   */
  async syncSearchConsoleData(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('+oauth.accessToken +oauth.refreshToken');

      if (!config || !config.syncSettings.scEnabled) {
        throw new Error('SC not connected');
      }

      // Decrypt token
      const accessToken = encryptionService.decrypt(config.oauth.accessToken);

      // Sync data
      const result = await searchConsoleService.syncData(
        config.scSiteUrl,
        accessToken,
        blogId,
        clientId
      );

      // Update config
      config.syncSettings.scLastSyncAt = new Date();
      config.syncSettings.scNextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      config.syncSettings.scSyncStatus = 'completed';

      await config.save();

      return result;
    } catch (error) {
      console.error('SC sync error:', error.message);

      // Update sync error
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });
      if (config) {
        config.syncSettings.scSyncStatus = 'failed';
        config.syncSettings.scNextSyncAt = new Date(Date.now() + 60 * 60 * 1000);
        await config.save();
      }

      throw error;
    }
  }

  /**
   * Refresh Google Analytics token
   */
  async refreshGoogleAnalyticsToken(config) {
    try {
      const refreshToken = encryptionService.decrypt(config.oauth.refreshToken);

      const tokens = await googleAnalyticsService.refreshAccessToken(refreshToken);

      config.oauth.accessToken = encryptionService.encrypt(tokens.access_token);
      config.oauth.expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await config.save();

      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error.message);
      config.connectionStatus = 'expired';
      config.syncSettings.enabled = false;
      await config.save();
      throw error;
    }
  }

  /**
   * Start automatic sync for a configuration
   */
  startAutoSync(configId) {
    // Clear existing interval if any
    if (this.syncIntervals.has(configId)) {
      clearInterval(this.syncIntervals.get(configId));
    }

    // Set up daily sync (runs at midnight)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
      // First sync
      this.runSync(configId);

      // Then every 24 hours
      const interval = setInterval(() => {
        this.runSync(configId);
      }, 24 * 60 * 60 * 1000);

      this.syncIntervals.set(configId, interval);
    }, timeUntilMidnight);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(configId) {
    if (this.syncIntervals.has(configId)) {
      clearInterval(this.syncIntervals.get(configId));
      this.syncIntervals.delete(configId);
    }
  }

  /**
   * Run sync for a configuration
   */
  async runSync(configId) {
    try {
      const config = await GoogleAnalyticsConfig.findById(configId);

      if (!config) return;

      if (config.syncSettings.enabled) {
        await this.syncGoogleAnalyticsData(config.blogId, config.clientId);
      }

      if (config.syncSettings.scEnabled) {
        await this.syncSearchConsoleData(config.blogId, config.clientId);
      }
    } catch (error) {
      console.error(`Sync failed for ${configId}:`, error.message);
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(blogId, clientId, limit = 10) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('-oauth.accessToken -oauth.refreshToken');

      if (!config) {
        return { gaHistory: [], scHistory: [] };
      }

      return {
        gaHistory: config.syncSettings.syncErrors.slice(-limit),
        scHistory: config.syncSettings.scSyncErrors?.slice(-limit) || []
      };
    } catch (error) {
      console.error('History fetch error:', error.message);
      throw error;
    }
  }

  /**
   * Validate connection
   */
  async validateConnection(blogId, clientId) {
    try {
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('+oauth.accessToken');

      if (!config || config.connectionStatus !== 'connected') {
        return { valid: false, reason: 'Not connected' };
      }

      if (new Date() > config.oauth.expiresAt) {
        return { valid: false, reason: 'Token expired' };
      }

      // Try to fetch properties to verify token works
      const accessToken = encryptionService.decrypt(config.oauth.accessToken);
      const properties = await googleAnalyticsService.getProperties(accessToken);

      const propertyExists = properties.some(p => p.name === config.gaAccountInfo.propertyId);

      return {
        valid: propertyExists,
        reason: propertyExists ? 'Connected and valid' : 'Property no longer exists'
      };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Fetch geography data (helper)
   */
  async fetchGeographyData(accessToken, propertyId, startDate, endDate) {
    // This would be implemented with actual GA API call
    // For now, return empty array
    return [];
  }
}

module.exports = new IntegrationManager();
