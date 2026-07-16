const express = require('express');
const authorizationService = require('../services/authorization');
const cacheService = require('../services/cacheService');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/stats', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { endpoint, method, days = 30 } = req.query;

    const stats = await cacheService.getCacheStats(endpoint, method, parseInt(days));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/global-stats', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const stats = await cacheService.getGlobalCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/memory-stats', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const stats = await cacheService.getMemoryCacheSize();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/configs', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { isActive } = req.query;
    const configs = await cacheService.getCacheConfigs(
      isActive === 'true' ? true : isActive === 'false' ? false : null
    );
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/configs', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { key, endpoint, method, ttlSeconds, strategy, cacheable, description, maxSize, includeHeaders, excludeHeaders, queryParamsDontAffect } = req.body;

    if (!key || !endpoint || !ttlSeconds) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const config = await cacheService.createCacheConfig({
      key,
      endpoint,
      method: method || 'GET',
      ttlSeconds,
      strategy: strategy || 'hybrid',
      cacheable: cacheable !== false,
      description,
      maxSize: maxSize || 1000000,
      includeHeaders: includeHeaders || [],
      excludeHeaders: excludeHeaders || [],
      queryParamsDontAffect: queryParamsDontAffect || []
    });

    res.status(201).json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/configs/:configId', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { configId } = req.params;

    const config = await cacheService.updateCacheConfig(configId, req.body);

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/configs/:configId', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { configId } = req.params;

    await cacheService.deleteCacheConfig(configId);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/invalidate', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { endpoint, method } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const result = await cacheService.invalidateCache(endpoint, method);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/invalidate-pattern', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }

    const result = await cacheService.invalidateCachePattern(pattern);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/clear', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const result = await cacheService.clearCache();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/clear-expired', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const result = await cacheService.clearExpiredCache();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
