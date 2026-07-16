const express = require('express');
const authorizationService = require('../services/authorization');
const rateLimitService = require('../services/rateLimitService');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/status', async (req, res) => {
  try {
    const status = await rateLimitService.getUserRateLimitStatus(req.user.userId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rules', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { isActive } = req.query;
    const rules = await rateLimitService.getRules(
      isActive === 'true' ? true : isActive === 'false' ? false : null
    );
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rules', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { name, description, endpoint, method, userRole, requestsPerWindow, windowDurationSeconds, blockDurationSeconds, blockMessage, bypassRoles } = req.body;

    if (!name || !endpoint || !requestsPerWindow || !windowDurationSeconds) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const rule = await rateLimitService.createRule({
      name,
      description,
      endpoint,
      method: method || 'ALL',
      userRole: userRole || 'all',
      requestsPerWindow,
      windowDurationSeconds,
      blockDurationSeconds: blockDurationSeconds || 3600,
      blockMessage: blockMessage || 'Rate limit exceeded. Please try again later.',
      bypassRoles: bypassRoles || []
    });

    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rules/:ruleId', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await rateLimitService.updateRule(ruleId, updates);

    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/rules/:ruleId', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { ruleId } = req.params;

    await rateLimitService.deleteRule(ruleId);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { userId, ipAddress } = req.query;

    const stats = await rateLimitService.getRateLimitStats(userId, ipAddress);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unblock', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { userId, ipAddress } = req.body;

    if (!userId && !ipAddress) {
      return res.status(400).json({ error: 'Either userId or ipAddress must be provided' });
    }

    const result = await rateLimitService.unblockIdentifier(userId, ipAddress);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cleanup', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const result = await rateLimitService.clearOldRateLimits();

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
