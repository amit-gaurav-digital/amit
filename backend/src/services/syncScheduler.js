const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
const integrationManager = require('./integrationManager');

class SyncScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize the sync scheduler
   * Start syncing all enabled integrations
   */
  async init() {
    try {
      console.log('🔄 Initializing sync scheduler...');

      // Get all enabled integrations
      const configs = await GoogleAnalyticsConfig.find({
        'syncSettings.enabled': true
      });

      console.log(`Found ${configs.length} enabled integrations`);

      // Start sync for each
      for (const config of configs) {
        integrationManager.startAutoSync(config._id);
      }

      // Set up daily cleanup job (remove old sync errors)
      this.scheduleDailyCleanup();

      // Set up reinitialization check (in case server restarts)
      this.scheduleReinitCheck();

      this.isRunning = true;
      console.log('✅ Sync scheduler initialized');
    } catch (error) {
      console.error('Failed to initialize sync scheduler:', error.message);
    }
  }

  /**
   * Schedule a daily cleanup of old sync errors
   */
  scheduleDailyCleanup() {
    // Run cleanup at 2 AM daily
    const now = new Date();
    const cleanup = new Date(now);
    cleanup.setHours(2, 0, 0, 0);

    if (cleanup < now) {
      cleanup.setDate(cleanup.getDate() + 1);
    }

    const timeUntilCleanup = cleanup - now;

    setTimeout(() => {
      // Run cleanup
      this.cleanupOldErrors();

      // Schedule next cleanup
      setInterval(() => {
        this.cleanupOldErrors();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCleanup);
  }

  /**
   * Cleanup old sync errors (keep only last 30 days)
   */
  async cleanupOldErrors() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await GoogleAnalyticsConfig.updateMany(
        {},
        {
          $pull: {
            'syncSettings.syncErrors': {
              timestamp: { $lt: thirtyDaysAgo }
            },
            'syncSettings.scSyncErrors': {
              timestamp: { $lt: thirtyDaysAgo }
            }
          }
        }
      );

      console.log(`✅ Cleanup: Removed old sync errors from ${result.modifiedCount} configs`);
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }

  /**
   * Check if any integrations need to be rescheduled
   */
  scheduleReinitCheck() {
    // Check every 6 hours if any integrations are missing their sync
    setInterval(async () => {
      try {
        const configs = await GoogleAnalyticsConfig.find({
          'syncSettings.enabled': true
        });

        for (const config of configs) {
          const nextSync = config.syncSettings.nextSyncAt;
          const now = new Date();

          // If next sync is in the past and no sync is happening, reschedule
          if (nextSync < now && !this.scheduledJobs.has(config._id)) {
            console.log(`🔄 Rescheduling sync for ${config.blogId}`);
            integrationManager.startAutoSync(config._id);
          }
        }
      } catch (error) {
        console.error('Reinit check error:', error.message);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }

  /**
   * Manually schedule a sync
   */
  async scheduleSyncNow(blogId, clientId) {
    try {
      const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('Configuration not found');
      }

      // Run sync immediately
      await integrationManager.runSync(config._id);

      return { success: true, syncedAt: new Date() };
    } catch (error) {
      console.error('Schedule sync error:', error.message);
      throw error;
    }
  }

  /**
   * Get sync schedule status
   */
  async getScheduleStatus() {
    try {
      const configs = await GoogleAnalyticsConfig.find().select('-oauth.accessToken -oauth.refreshToken');

      const status = {
        isRunning: this.isRunning,
        activeJobs: this.scheduledJobs.size,
        configurations: configs.map(config => ({
          blogId: config.blogId,
          gaEnabled: config.syncSettings.enabled,
          scEnabled: config.syncSettings.scEnabled,
          gaLastSync: config.syncSettings.lastSyncAt,
          gaNextSync: config.syncSettings.nextSyncAt,
          gaSyncStatus: config.syncSettings.syncStatus,
          scLastSync: config.syncSettings.scLastSyncAt,
          scNextSync: config.syncSettings.scNextSyncAt,
          scSyncStatus: config.syncSettings.scSyncStatus,
          gaErrors: config.syncSettings.syncErrors?.length || 0,
          scErrors: config.syncSettings.scSyncErrors?.length || 0
        }))
      };

      return status;
    } catch (error) {
      console.error('Status check error:', error.message);
      throw error;
    }
  }

  /**
   * Enable automatic sync for a configuration
   */
  async enableAutoSync(blogId, clientId) {
    try {
      const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('Configuration not found');
      }

      config.syncSettings.enabled = true;
      config.syncSettings.nextSyncAt = new Date(Date.now() + 60000); // Sync in 1 minute
      await config.save();

      integrationManager.startAutoSync(config._id);

      return { success: true, message: 'Auto sync enabled' };
    } catch (error) {
      console.error('Enable auto sync error:', error.message);
      throw error;
    }
  }

  /**
   * Disable automatic sync for a configuration
   */
  async disableAutoSync(blogId, clientId) {
    try {
      const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId });

      if (!config) {
        throw new Error('Configuration not found');
      }

      config.syncSettings.enabled = false;
      await config.save();

      integrationManager.stopAutoSync(config._id);

      return { success: true, message: 'Auto sync disabled' };
    } catch (error) {
      console.error('Disable auto sync error:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed sync status for a blog
   */
  async getSyncStatus(blogId, clientId) {
    try {
      const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
      const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId }).select('-oauth.accessToken -oauth.refreshToken');

      if (!config) {
        return {
          ga: { connected: false },
          sc: { connected: false }
        };
      }

      return {
        ga: {
          connected: config.connectionStatus === 'connected',
          lastSync: config.syncSettings.lastSyncAt,
          nextSync: config.syncSettings.nextSyncAt,
          status: config.syncSettings.syncStatus,
          errorCount: config.syncSettings.syncErrors?.length || 0,
          lastError: config.syncSettings.syncErrors?.[config.syncSettings.syncErrors.length - 1]?.error,
          enabled: config.syncSettings.enabled
        },
        sc: {
          connected: config.syncSettings.scEnabled || false,
          lastSync: config.syncSettings.scLastSyncAt,
          nextSync: config.syncSettings.scNextSyncAt,
          status: config.syncSettings.scSyncStatus,
          errorCount: config.syncSettings.scSyncErrors?.length || 0,
          lastError: config.syncSettings.scSyncErrors?.[config.syncSettings.scSyncErrors.length - 1]?.error
        }
      };
    } catch (error) {
      console.error('Get sync status error:', error.message);
      throw error;
    }
  }

  /**
   * Shutdown the scheduler
   */
  shutdown() {
    console.log('🛑 Shutting down sync scheduler...');

    // Stop all syncs
    for (const [configId, interval] of this.scheduledJobs) {
      clearInterval(interval);
    }

    this.scheduledJobs.clear();
    this.isRunning = false;

    console.log('✅ Sync scheduler shutdown complete');
  }
}

module.exports = new SyncScheduler();
