const rateLimitService = require('../services/rateLimitService');

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const endpoint = req.baseUrl || req.path;
    const method = req.method;
    const userRole = req.user?.role || 'anonymous';

    const result = await rateLimitService.checkRateLimit(
      userId,
      ipAddress,
      endpoint,
      method,
      userRole
    );

    if (result.rule) {
      res.set('X-RateLimit-Limit', result.rule.requestsPerWindow);
      if (result.remaining !== undefined) {
        res.set('X-RateLimit-Remaining', result.remaining);
      }
      if (result.resetAt) {
        res.set('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000));
      }
    }

    if (!result.allowed) {
      return res.status(429).json({
        error: result.reason || 'Rate limit exceeded',
        retryAfter: result.remainingBlockSeconds,
        blockedUntil: result.blockedUntil
      });
    }

    res.locals.rateLimitInfo = {
      remaining: result.remaining,
      resetAt: result.resetAt,
      bypassed: result.bypassed
    };

    next();
  } catch (error) {
    console.error('Rate limit middleware error:', error.message);
    next();
  }
};

module.exports = rateLimitMiddleware;
