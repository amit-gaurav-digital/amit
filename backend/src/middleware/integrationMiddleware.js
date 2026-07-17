const GoogleAnalyticsConfig = require('../models/GoogleAnalyticsConfig');

const verifyIntegrationExists = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const config = await GoogleAnalyticsConfig.findOne({ blogId, clientId: req.user.clientId });

    if (!config) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    req.integration = config;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyGAConnection = async (req, res, next) => {
  try {
    const config = req.integration || await GoogleAnalyticsConfig.findOne({
      blogId: req.params.blogId,
      clientId: req.user.clientId
    });

    if (!config || config.connectionStatus !== 'connected') {
      return res.status(400).json({ error: 'Google Analytics not connected' });
    }

    if (new Date() > config.oauth.expiresAt) {
      return res.status(400).json({ error: 'Connection expired. Please reconnect' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifySCConnection = async (req, res, next) => {
  try {
    const config = req.integration || await GoogleAnalyticsConfig.findOne({
      blogId: req.params.blogId,
      clientId: req.user.clientId
    });

    if (!config || !config.syncSettings.scEnabled) {
      return res.status(400).json({ error: 'Search Console not connected' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleIntegrationError = (err, req, res, next) => {
  console.error('Integration error:', err.message);

  if (err.message.includes('encryption')) {
    return res.status(500).json({ error: 'Credential decryption failed' });
  }

  if (err.message.includes('API')) {
    return res.status(503).json({ error: 'External API error. Please try again later' });
  }

  res.status(500).json({ error: err.message || 'Integration operation failed' });
};

module.exports = {
  verifyIntegrationExists,
  verifyGAConnection,
  verifySCConnection,
  handleIntegrationError
};
