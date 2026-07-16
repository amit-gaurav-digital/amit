const express = require('express');
const authorizationService = require('../services/authorization');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use(authorizationService.requireAuth);

router.get('/my-subscription', async (req, res) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.userId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upgrade', async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const subscription = await subscriptionService.upgradePlan(
      req.user.userId,
      planId,
      billingCycle || 'monthly'
    );

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/downgrade', async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const subscription = await subscriptionService.downgradePlan(
      req.user.userId,
      planId,
      billingCycle || 'monthly'
    );

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await subscriptionService.cancelSubscription(
      req.user.userId,
      reason
    );

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/usage', async (req, res) => {
  try {
    const stats = await subscriptionService.getUsageStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/billing-history', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const history = await subscriptionService.getBillingHistory(
      req.user.userId,
      Math.min(parseInt(limit), 100),
      parseInt(skip)
    );

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-feature/:feature', async (req, res) => {
  try {
    const { feature } = req.params;

    const hasAccess = await subscriptionService.checkFeatureAccess(
      req.user.userId,
      feature
    );

    res.json({ hasAccess, feature });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset-usage', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const result = await subscriptionService.resetMonthlyUsage();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
