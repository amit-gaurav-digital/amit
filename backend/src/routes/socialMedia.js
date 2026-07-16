const express = require('express');
const authorizationService = require('../services/authorization');
const socialMediaService = require('../services/socialMedia');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.post('/connect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { tokenData, profile } = req.body;

    if (!['twitter', 'facebook', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    if (!tokenData || !profile) {
      return res.status(400).json({ error: 'Token data and profile are required' });
    }

    const socialMedia = await socialMediaService.connectSocialMedia(
      req.user.userId,
      platform,
      tokenData,
      profile
    );

    res.json(socialMedia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/disconnect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    if (!['twitter', 'facebook', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    const result = await socialMediaService.disconnectSocialMedia(
      req.user.userId,
      platform
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await socialMediaService.getConnectedAccounts(req.user.userId);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/post/:blogId', authorizationService.requirePermission('blog.read'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { platforms, customContent } = req.body;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'Platforms array is required' });
    }

    const result = await socialMediaService.postToSocialMedia(
      req.user.userId,
      blogId,
      platforms,
      customContent
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/schedule/:blogId', authorizationService.requirePermission('blog.read'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { platforms, scheduledFor, customContent } = req.body;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'Platforms array is required' });
    }

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const result = await socialMediaService.schedulePost(
      req.user.userId,
      blogId,
      platforms,
      new Date(scheduledFor),
      customContent
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/posts/:blogId', authorizationService.requirePermission('blog.read'), async (req, res) => {
  try {
    const { blogId } = req.params;

    const posts = await socialMediaService.getSocialMediaPosts(blogId);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await socialMediaService.getUserSocialStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/post/:postId/refresh-metrics', async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await socialMediaService.updateEngagementMetrics(postId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
