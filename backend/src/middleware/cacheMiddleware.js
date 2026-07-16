const cacheService = require('../services/cacheService');

const cacheMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    return next();
  }

  try {
    const config = cacheService.getConfig(req.baseUrl || req.path, req.method);

    if (!config || !config.cacheable) {
      return next();
    }

    const cacheKey = cacheService.generateCacheKey(
      req.baseUrl || req.path,
      req.method,
      req.query,
      req.user?.userId
    );

    const cached = await cacheService.getCachedResponse(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.json(cached.data);
    }

    res.set('X-Cache', 'MISS');
    res.set('X-Cache-Key', cacheKey);

    const originalJson = res.json.bind(res);

    res.json = function(data) {
      const responseTime = Date.now() - startTime;

      cacheService.setCachedResponse(
        cacheKey,
        req.baseUrl || req.path,
        req.method,
        data,
        responseTime
      ).catch(error => {
        console.error('Cache storage error:', error.message);
      });

      return originalJson(data);
    };

    next();
  } catch (error) {
    console.error('Cache middleware error:', error.message);
    next();
  }
};

module.exports = cacheMiddleware;
