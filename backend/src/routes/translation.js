const express = require('express');
const authorizationService = require('../services/authorization');
const translationService = require('../services/translation');
const BlogLanguage = require('../models/BlogLanguage');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/languages', async (req, res) => {
  try {
    const languages = BlogLanguage.getAvailableLanguages();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/translate/:blogId', authorizationService.requirePermission('blog.edit.all'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }

    const translation = await translationService.translateBlog(
      blogId,
      language,
      req.user.userId
    );

    res.status(201).json(translation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/translate-bulk/:blogId', authorizationService.requirePermission('blog.edit.all'), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { languages } = req.body;

    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ error: 'Languages array is required' });
    }

    const result = await translationService.bulkTranslateBlog(
      blogId,
      languages,
      req.user.userId
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/translations/:blogId', authorizationService.requirePermission('blog.read'), async (req, res) => {
  try {
    const { blogId } = req.params;

    const translations = await translationService.getTranslations(blogId);

    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/translation/:blogId/:language', authorizationService.requirePermission('blog.read'), async (req, res) => {
  try {
    const { blogId, language } = req.params;

    const translation = await translationService.getTranslationByLanguage(blogId, language);

    res.json(translation);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/stats/:blogId', authorizationService.requirePermission('analytics.view'), async (req, res) => {
  try {
    const { blogId } = req.params;

    const stats = await translationService.getBlogLanguageStats(blogId);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/translation/:translationId/review', authorizationService.requirePermission('blog.approve'), async (req, res) => {
  try {
    const { translationId } = req.params;

    const translation = await BlogLanguage.findById(translationId);

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    translation.markAsReviewed(req.user.userId);
    await translation.save();

    res.json(translation.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/translation/:translationId/publish', authorizationService.requirePermission('blog.publish'), async (req, res) => {
  try {
    const { translationId } = req.params;

    const publishedTranslation = await translationService.publishTranslation(translationId);

    res.json(publishedTranslation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/translation/:translationId', authorizationService.requirePermission('blog.delete.all'), async (req, res) => {
  try {
    const { translationId } = req.params;

    const result = await translationService.deleteTranslation(translationId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/translation/:translationId', authorizationService.requirePermission('blog.edit.all'), async (req, res) => {
  try {
    const { translationId } = req.params;
    const { title, content, metaDescription, keywords } = req.body;

    const translation = await BlogLanguage.findByIdAndUpdate(
      translationId,
      {
        $set: {
          title,
          content,
          metaDescription,
          keywords,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json(translation.toObject());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
