const express = require('express');
const router = express.Router();
const authorizationService = require('../services/authorization');
const integrationManager = require('../services/integrationManager');
const googleAnalyticsService = require('../services/googleAnalyticsService');
const searchConsoleService = require('../services/searchConsoleService');
const Blog = require('../models/Blog');

// Middleware to verify blog ownership
const verifyBlogOwnership = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);

    if (!blog || blog.clientId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.blog = blog;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/integrations/list/:clientId
 * List all integrations for a client
 */
router.get('/list/:clientId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    if (clientId !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');
    const configs = await GoogleAnalyticsConfig.find({ clientId }).select('-oauth.accessToken -oauth.refreshToken');

    const integrations = configs.map(config => ({
      id: config._id,
      blogId: config.blogId,
      googleAnalytics: {
        connected: config.connectionStatus === 'connected',
        propertyId: config.gaAccountInfo?.propertyId,
        propertyName: config.gaAccountInfo?.propertyName,
        lastSync: config.syncSettings.lastSyncAt
      },
      searchConsole: {
        connected: config.syncSettings.scEnabled || false,
        siteUrl: config.scSiteUrl,
        lastSync: config.syncSettings.scLastSyncAt
      }
    }));

    res.json({ integrations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/status/:blogId
 * Get integration status for a blog
 */
router.get('/status/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const status = await integrationManager.getConnectionStatus(blogId, req.user.userId);

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/google-analytics/auth-url
 * Get Google Analytics OAuth URL
 */
router.get('/google-analytics/auth-url', authorizationService.requireAuth, async (req, res) => {
  try {
    const state = Math.random().toString(36).substr(2, 9);
    const authUrl = await googleAnalyticsService.getAuthUrl(state);

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/google-analytics/connect/:blogId
 * Connect Google Analytics with OAuth code
 */
router.post('/google-analytics/connect/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { code } = req.body;

    console.log('GA Connect endpoint called:', {
      blogId,
      userId: req.user.userId,
      codeLength: code?.length,
      hasCode: !!code
    });

    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    console.log('Exchanging OAuth code for tokens...');
    const tokens = await googleAnalyticsService.exchangeCodeForToken(code);
    console.log('Token exchange successful, tokens received');

    // Get list of properties
    console.log('Fetching Google Analytics properties...');
    const properties = await googleAnalyticsService.getProperties(tokens.access_token);
    console.log('Properties fetched:', properties.length);

    if (properties.length === 0) {
      console.error('No analytics properties found for this account');
      return res.status(400).json({ error: 'No analytics properties found' });
    }

    // Use the first property (user should select in UI in future)
    const property = properties[0];
    console.log('Using first property:', property.displayName);

    // Connect in database
    console.log('Saving connection to database...');
    const result = await integrationManager.connectGoogleAnalytics(
      req.user.userId,
      blogId,
      tokens,
      {
        accountId: property.parent?.split('/')[1],
        propertyId: property.name?.split('/')[1],
        propertyName: property.displayName,
        websiteUrl: property.websiteUrl,
        timeZone: property.timeZone,
        industryCategory: property.industryCategory
      }
    );

    console.log('Connection saved successfully');
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GA connection error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/google-analytics/disconnect/:blogId
 * Disconnect Google Analytics
 */
router.post('/google-analytics/disconnect/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const result = await integrationManager.disconnectGoogleAnalytics(blogId, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/google-analytics/sync/:blogId
 * Manually trigger Google Analytics sync
 */
router.post('/google-analytics/sync/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const result = await integrationManager.syncGoogleAnalyticsData(blogId, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/google-analytics/sync-history/:blogId
 * Get Google Analytics sync history
 */
router.get('/google-analytics/sync-history/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const history = await integrationManager.getSyncHistory(blogId, req.user.userId);

    res.json({ syncHistory: history.gaHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/search-console/connect/:blogId
 * Connect Search Console
 */
router.post('/search-console/connect/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { siteUrl } = req.body;

    if (!siteUrl) {
      return res.status(400).json({ error: 'Site URL required' });
    }

    const result = await integrationManager.connectSearchConsole(req.user.userId, blogId, siteUrl, null);

    res.json(result);
  } catch (error) {
    console.error('SC connection error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/search-console/disconnect/:blogId
 * Disconnect Search Console
 */
router.post('/search-console/disconnect/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const result = await integrationManager.disconnectSearchConsole(blogId, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/search-console/sync/:blogId
 * Manually trigger Search Console sync
 */
router.post('/search-console/sync/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const result = await integrationManager.syncSearchConsoleData(blogId, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/search-console/sync-history/:blogId
 * Get Search Console sync history
 */
router.get('/search-console/sync-history/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const history = await integrationManager.getSyncHistory(blogId, req.user.userId);

    res.json({ syncHistory: history.scHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/integrations/validate/:blogId
 * Validate integration connection
 */
router.post('/validate/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;

    const result = await integrationManager.validateConnection(blogId, req.user.userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/oauth/callback
 * OAuth callback from Google
 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      return res.redirect(`${frontendUrl}/dashboard/settings/integrations?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/dashboard/settings/integrations?error=no_code`);
    }

    // Redirect back to frontend with code and state so it can complete the OAuth flow
    res.redirect(`${frontendUrl}/dashboard/settings/integrations?code=${code}&state=${state}`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/settings/integrations?error=${error.message}`);
  }
});

/**
 * POST /api/integrations/test/:blogId
 * Test integration connection
 */
router.post('/test/:blogId', authorizationService.requireAuth, verifyBlogOwnership, async (req, res) => {
  try {
    const { blogId } = req.params;
    const status = await integrationManager.getConnectionStatus(blogId, req.user.userId);

    res.json({
      googleAnalytics: {
        ...status.googleAnalytics,
        testResult: status.googleAnalytics.connected ? 'Connected' : 'Not connected'
      },
      searchConsole: {
        ...status.searchConsole,
        testResult: status.searchConsole.connected ? 'Connected' : 'Not connected'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
