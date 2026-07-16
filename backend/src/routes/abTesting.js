const express = require('express');
const authorizationService = require('../services/authorization');
const abTestingService = require('../services/abTesting');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.post('/', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { blogId, name, description, testType, testField, variants, configuration } = req.body;

    if (!blogId || !name || !testType || !testField || !variants || variants.length < 2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const test = await abTestingService.createTest({
      blogId,
      name,
      description,
      testType,
      testField,
      variants,
      configuration,
      createdBy: req.user.userId
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/blog/:blogId', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { status } = req.query;

    const tests = await abTestingService.getTestsForBlog(blogId, status);

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blog/:blogId/active', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;

    const tests = await abTestingService.getActiveTests(blogId);

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:testId', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { testId } = req.params;

    const testData = await abTestingService.getTestResults(testId);

    res.json(testData);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/:testId/start', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await abTestingService.startTest(testId);

    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:testId/stop', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await abTestingService.stopTest(testId);

    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:testId/complete', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { testId } = req.params;
    const { autoSelect = false } = req.body;

    const test = await abTestingService.completeTest(testId, autoSelect);

    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:testId/cancel', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await abTestingService.cancelTest(testId);

    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:testId/configuration', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { testId } = req.params;
    const { configuration } = req.body;

    const test = await abTestingService.updateTestConfiguration(testId, configuration);

    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:testId/event', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId, eventType, data } = req.body;

    if (!variantId || !eventType) {
      return res.status(400).json({ error: 'variantId and eventType are required' });
    }

    await abTestingService.recordEvent(testId, variantId, eventType, data);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:testId/analyze', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { testId } = req.params;

    const winner = await abTestingService.analyzeResults(testId);

    res.json({ winner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:testId/assignment/:userId', async (req, res) => {
  try {
    const { testId, userId } = req.params;

    const assignment = abTestingService.getVariantAssignment(testId, userId);

    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
