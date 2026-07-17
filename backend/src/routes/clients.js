const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Subscription = require('../models/Subscription');
const APIKey = require('../models/APIKey');
const ActivityLog = require('../models/ActivityLog');
const Blog = require('../models/Blog');
const authorizationService = require('../services/authorization');
const crypto = require('crypto');

// Register new client (public endpoint)
router.post('/register', async (req, res) => {
  try {
    const { name, email, website, industryType, subscriptionPlan, timezone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    // Generate initial API key
    const { key, hash } = APIKey.generateKey();

    const client = new Client({
      name,
      email,
      website: website || null,
      industryType: industryType || 'Other',
      subscriptionPlan: subscriptionPlan || 'Basic',
      timezone: timezone || 'UTC',
      apiKeys: [{
        key: hash,
        name: 'Default Key',
        isActive: true
      }]
    });

    await client.save();

    // Create subscription
    const planFeatures = {
      'Basic': {
        maxBlogs: 20,
        maxUsers: 1,
        aiGenerationLimit: 10,
        storageGB: 5,
        customDomain: false,
        advancedAnalytics: false,
        apiAccess: false,
        multiChannelPublishing: false,
        monthlyPrice: 9
      },
      'Pro': {
        maxBlogs: 100,
        maxUsers: 5,
        aiGenerationLimit: 100,
        storageGB: 50,
        customDomain: true,
        advancedAnalytics: true,
        apiAccess: true,
        multiChannelPublishing: false,
        monthlyPrice: 29
      },
      'Enterprise': {
        maxBlogs: 500,
        maxUsers: 20,
        aiGenerationLimit: 1000,
        storageGB: 500,
        customDomain: true,
        advancedAnalytics: true,
        apiAccess: true,
        multiChannelPublishing: true,
        monthlyPrice: 99
      }
    };

    const features = planFeatures[subscriptionPlan || 'Basic'];
    const subscription = new Subscription({
      clientId: client._id,
      planType: subscriptionPlan || 'Basic',
      monthlyPrice: features.monthlyPrice,
      features,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await subscription.save();

    // Log activity
    await ActivityLog.logAction(
      client._id,
      null,
      'client_created',
      'client',
      client._id,
      name,
      { after: client.toObject() },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        subscriptionPlan: client.subscriptionPlan
      },
      apiKey: key,
      warning: 'Save this API key in a secure location. You won\'t be able to see it again.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client dashboard
router.get('/:clientId/dashboard', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get blog stats
    const blogs = await Blog.aggregate([
      { $match: { clientId: require('mongoose').Types.ObjectId(clientId) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$analytics.views' }
      }}
    ]);

    const stats = {
      totalBlogs: 0,
      publishedBlogs: 0,
      scheduledBlogs: 0,
      drafts: 0,
      totalViews: 0
    };

    blogs.forEach(blog => {
      stats.totalBlogs += blog.count;
      stats.totalViews += blog.totalViews || 0;
      if (blog._id === 'published') stats.publishedBlogs = blog.count;
      if (blog._id === 'scheduled') stats.scheduledBlogs = blog.count;
      if (blog._id === 'draft') stats.drafts = blog.count;
    });

    // Get recent activity
    const recentActivity = await ActivityLog.find({ clientId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get subscription
    const subscription = await Subscription.findOne({ clientId });

    // Get recent blogs
    const recentBlogs = await Blog.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status views publishedAt');

    // Get upcoming scheduled
    const upcoming = await Blog.find({ clientId, status: 'scheduled' })
      .sort({ scheduledFor: 1 })
      .limit(3)
      .select('title scheduledFor');

    res.json({
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        website: client.website,
        logo: client.logo,
        timezone: client.timezone
      },
      stats,
      recentActivity: recentActivity.map(log => ({
        action: log.action,
        resourceName: log.resourceName,
        timestamp: log.createdAt,
        user: log.userId ? { name: log.userId.name, email: log.userId.email } : null
      })),
      subscription: subscription ? {
        plan: subscription.planType,
        status: subscription.status,
        renewsAt: subscription.currentPeriodEnd,
        features: subscription.features
      } : null,
      recentBlogs,
      upcomingScheduled: upcoming
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client settings
router.put('/:clientId/settings', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { timezone, language, customBranding, metadata } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const oldData = { timezone: client.timezone, customBranding: client.customBranding };

    if (timezone) client.timezone = timezone;
    if (language) client.language = language;
    if (customBranding) {
      client.customBranding = { ...client.customBranding, ...customBranding };
    }
    if (metadata) client.metadata = { ...client.metadata, ...metadata };

    await client.save();

    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'settings_updated',
      'client',
      clientId,
      'Client Settings',
      { before: oldData, after: { timezone: client.timezone, customBranding: client.customBranding } },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      client
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API keys
router.get('/:clientId/api-keys', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const keys = await APIKey.find({ clientId });

    res.json({
      keys: keys.map(k => ({
        _id: k._id,
        name: k.keyName,
        key: k.keyHash.substring(0, 8) + '...' + k.keyHash.substring(k.keyHash.length - 4),
        permissions: k.permissions,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        isActive: k.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new API key
router.post('/:clientId/api-keys', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const { key, hash } = APIKey.generateKey();

    const apiKey = new APIKey({
      clientId,
      keyHash: hash,
      keyName: name,
      permissions: permissions || ['read:blogs'],
      isActive: true
    });

    await apiKey.save();

    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'api_key_created',
      'api_key',
      apiKey._id,
      name,
      { after: { name, permissions } },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      key,
      keyInfo: {
        _id: apiKey._id,
        name: apiKey.keyName,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt
      },
      warning: 'Save this key in a secure location. You won\'t be able to see it again.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revoke API key
router.delete('/:clientId/api-keys/:keyId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { clientId, keyId } = req.params;

    const apiKey = await APIKey.findById(keyId);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await APIKey.findByIdAndDelete(keyId);

    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'api_key_revoked',
      'api_key',
      keyId,
      apiKey.keyName,
      { before: { name: apiKey.keyName } },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
