const express = require('express');
const router = express.Router();
const AIGenerationConfig = require('../models/AIGenerationConfig');
const AIGenerationRequest = require('../models/AIGenerationRequest');
const AIPromptTemplate = require('../models/AIPromptTemplate');
const AIUsageLog = require('../models/AIUsageLog');
const AIBlogVariant = require('../models/AIBlogVariant');
const Blog = require('../models/Blog');
const ActivityLog = require('../models/ActivityLog');
const OpenAIService = require('../services/openaiService');
const ContentQualityService = require('../services/contentQualityService');
const QuotaService = require('../services/quotaService');
const authorizationService = require('../services/authorization');
const mongoose = require('mongoose');

// Middleware: Check AI is enabled for client
async function checkAIEnabled(req, res, next) {
  try {
    const clientId = req.user.clientId;
    const config = await AIGenerationConfig.findOne({ clientId });

    if (!config || !config.isActive) {
      return res.status(403).json({ error: 'AI generation not enabled for this client' });
    }

    if (!config.openaiApiKey) {
      return res.status(403).json({ error: 'OpenAI API key not configured' });
    }

    req.aiConfig = config;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Middleware: Check quota
async function checkQuota(req, res, next) {
  try {
    const clientId = req.user.clientId;
    const quotaCheck = await QuotaService.checkQuota(clientId, 1500); // Assume ~1500 tokens per generation

    if (!quotaCheck.canGenerate) {
      return res.status(429).json({
        error: 'Quota exceeded',
        quotaStatus: {
          tokensRemaining: quotaCheck.tokensRemaining,
          generationsRemaining: quotaCheck.generationsRemaining,
          quotaExceeded: quotaCheck.quotaExceeded
        }
      });
    }

    req.quotaStatus = quotaCheck;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==========================
// CONTENT GENERATION ENDPOINTS
// ==========================

/**
 * POST /ai/generate/outline
 * Generate blog outline from topic/keywords
 */
router.post('/generate/outline', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { topic, keywords = [], tone, targetAudience, additionalInstructions } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const clientId = req.user.clientId;

    // Create generation request record
    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'outline_only',
      topic,
      keywords,
      tone: tone || req.aiConfig.defaultTone,
      targetAudience,
      additionalInstructions,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    // Initialize OpenAI service
    const openai = new OpenAIService(req.aiConfig.openaiApiKey);

    // Generate outline
    const result = await openai.generateOutline(
      topic,
      keywords,
      tone || req.aiConfig.defaultTone,
      targetAudience,
      additionalInstructions
    );

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    // Parse outline from response
    const outlineLines = result.content.split('\n').filter(line => line.trim().length > 0);

    // Update generation request
    generationRequest.status = 'completed';
    generationRequest.generatedContent = {
      outline: outlineLines,
      keywords
    };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);

    await generationRequest.save();

    // Record usage
    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'outline_generation',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    // Log activity
    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'ai_content_generated',
      'ai_generation',
      generationRequest._id,
      `Outline: ${topic}`,
      { type: 'outline', tokensUsed: result.tokensUsed },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      generationRequestId: generationRequest._id,
      outline: outlineLines,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generate/full-content
 * Generate complete blog post
 */
router.post('/generate/full-content', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const {
      topic,
      keywords = [],
      outline = null,
      tone,
      length,
      language,
      contentType,
      includeOutline = true
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const clientId = req.user.clientId;

    // Create generation request
    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'full_content',
      topic,
      keywords,
      outline,
      tone: tone || req.aiConfig.defaultTone,
      length: length || req.aiConfig.defaultLength,
      language: language || req.aiConfig.defaultLanguage,
      contentType,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    // Generate content
    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.generateFullContent(
      topic,
      keywords,
      outline,
      tone || req.aiConfig.defaultTone,
      length || req.aiConfig.defaultLength,
      language || req.aiConfig.defaultLanguage,
      includeOutline
    );

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    // Parse content (extract title, excerpt, content)
    const contentParts = result.content.split('\n\n');
    let title = '';
    let excerpt = '';
    let content = result.content;

    // Simple parsing - look for title in first line
    if (contentParts[0].length < 100) {
      title = contentParts[0].replace(/^#+\s*/, '').trim();
      content = contentParts.slice(1).join('\n\n');
    }

    // Generate quality metrics
    const qualityReport = ContentQualityService.generateQualityReport(content, title, excerpt, keywords);

    // Update generation request
    generationRequest.status = 'completed';
    generationRequest.generatedContent = {
      title,
      excerpt,
      content,
      keywords,
      readabilityScore: qualityReport.readabilityMetrics.flesch_reading_ease,
      seoScore: qualityReport.seoScore,
      wordCount: qualityReport.wordCount,
      estimatedReadTime: qualityReport.estimatedReadTime
    };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);
    generationRequest.readabilityMetrics = qualityReport.readabilityMetrics;
    generationRequest.plagiarismScore = qualityReport.plagiarismScore;

    await generationRequest.save();

    // Record usage
    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'full_content_generation',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    // Log activity
    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'ai_content_generated',
      'ai_generation',
      generationRequest._id,
      title || topic,
      { type: 'full_content', tokensUsed: result.tokensUsed, wordCount: qualityReport.wordCount },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      generationRequestId: generationRequest._id,
      title,
      excerpt,
      content,
      keywords,
      readabilityScore: qualityReport.readabilityMetrics.flesch_reading_ease,
      seoScore: qualityReport.seoScore,
      wordCount: qualityReport.wordCount,
      estimatedReadTime: qualityReport.estimatedReadTime,
      plagiarismScore: qualityReport.plagiarismScore,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generate/title
 * Generate multiple title options
 */
router.post('/generate/title', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { content, keywords = [], tone, count = 3 } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const clientId = req.user.clientId;

    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'title_generation',
      topic: 'Title generation',
      keywords,
      tone: tone || req.aiConfig.defaultTone,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.generateTitles(
      content,
      keywords,
      tone || req.aiConfig.defaultTone,
      count
    );

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    // Parse titles
    const titles = result.content
      .split('\n')
      .filter(title => title.trim().length > 0)
      .slice(0, count)
      .map(title => ({
        title: title.replace(/^\d+\.\s*/, '').trim(),
        seoScore: ContentQualityService.calculateSEOScore(content, title, '', keywords)
      }));

    generationRequest.status = 'completed';
    generationRequest.generatedContent = { titles };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);

    await generationRequest.save();

    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'title_generation',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    res.status(201).json({
      success: true,
      titles,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generate/excerpt
 * Generate SEO optimized excerpt
 */
router.post('/generate/excerpt', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { content, keywords = [], maxLength = 160 } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const clientId = req.user.clientId;

    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'excerpt_generation',
      topic: 'Excerpt generation',
      keywords,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.generateExcerpt(content, keywords, maxLength);

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    const excerpt = result.content.trim();

    generationRequest.status = 'completed';
    generationRequest.generatedContent = { excerpt, keywords };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);

    await generationRequest.save();

    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'excerpt_generation',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    res.status(201).json({
      success: true,
      excerpt,
      length: excerpt.length,
      seoScore: ContentQualityService.calculateSEOScore(content, '', excerpt, keywords),
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/refine
 * Refine existing content
 */
router.post('/refine', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { content, refinementType, targetLength, tone, additionalInstructions } = req.body;

    if (!content || !refinementType) {
      return res.status(400).json({ error: 'Content and refinementType are required' });
    }

    const clientId = req.user.clientId;

    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'refinement',
      topic: refinementType,
      sourceContent: content,
      tone,
      length: targetLength,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.refineContent(content, refinementType, targetLength, tone, additionalInstructions);

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    const refinedContent = result.content;
    const qualityReport = ContentQualityService.generateQualityReport(refinedContent, '', '', []);

    generationRequest.status = 'completed';
    generationRequest.generatedContent = {
      content: refinedContent,
      refinementType
    };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);
    generationRequest.readabilityMetrics = qualityReport.readabilityMetrics;

    await generationRequest.save();

    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'refinement',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    res.status(201).json({
      success: true,
      refinedContent,
      readabilityScore: qualityReport.readabilityMetrics.flesch_reading_ease,
      seoScore: qualityReport.seoScore,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/rewrite
 * Rewrite with different tone/style
 */
router.post('/rewrite', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { content, tone, audience, style, preserveKeywords = true } = req.body;

    if (!content || !tone) {
      return res.status(400).json({ error: 'Content and tone are required' });
    }

    const clientId = req.user.clientId;

    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'rewrite',
      topic: 'Rewrite',
      sourceContent: content,
      tone,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.rewriteContent(content, tone, audience, style, preserveKeywords);

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    const rewrittenContent = result.content;
    const qualityReport = ContentQualityService.generateQualityReport(rewrittenContent, '', '', []);

    generationRequest.status = 'completed';
    generationRequest.generatedContent = {
      content: rewrittenContent,
      tone
    };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);
    generationRequest.readabilityMetrics = qualityReport.readabilityMetrics;

    await generationRequest.save();

    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'rewrite',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    res.status(201).json({
      success: true,
      rewrittenContent,
      readabilityScore: qualityReport.readabilityMetrics.flesch_reading_ease,
      seoScore: qualityReport.seoScore,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/seo-optimize
 * Optimize content for SEO
 */
router.post('/seo-optimize', authorizationService.requireAuth, checkAIEnabled, checkQuota, async (req, res) => {
  try {
    const { content, title, keywords = [], targetDensity = 1.5 } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const clientId = req.user.clientId;

    const generationRequest = new AIGenerationRequest({
      clientId,
      userId: req.user.userId,
      generationType: 'seo_optimization',
      keywords,
      sourceContent: content,
      status: 'generating',
      model: req.aiConfig.openaiModel
    });

    await generationRequest.save();

    const openai = new OpenAIService(req.aiConfig.openaiApiKey);
    const result = await openai.seoOptimizeContent(content, title, keywords, targetDensity);

    if (!result.success) {
      generationRequest.status = 'failed';
      generationRequest.error = result.error;
      await generationRequest.save();

      return res.status(500).json({ error: 'Generation failed', details: result.error });
    }

    const optimizedContent = result.content;
    const keywordDensity = ContentQualityService.calculateKeywordDensity(optimizedContent, keywords);

    generationRequest.status = 'completed';
    generationRequest.generatedContent = {
      content: optimizedContent,
      keywords,
      keywordDensity
    };
    generationRequest.tokensUsed = result.tokensUsed;
    generationRequest.costUsd = QuotaService.calculateCost(result.tokensUsed, req.aiConfig.openaiModel);

    await generationRequest.save();

    await QuotaService.recordUsage(
      clientId,
      req.user.userId,
      result.tokensUsed,
      generationRequest.costUsd,
      'seo_optimization',
      req.aiConfig.openaiModel,
      generationRequest._id
    );

    res.status(201).json({
      success: true,
      optimizedContent,
      seoScore: ContentQualityService.calculateSEOScore(optimizedContent, title, '', keywords),
      keywordDensity,
      tokensUsed: result.tokensUsed,
      costUsd: Number(generationRequest.costUsd.toFixed(4))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// GENERATION MANAGEMENT ENDPOINTS
// ==========================

/**
 * GET /ai/generation/:generationRequestId
 * Get generation details
 */
router.get('/generation/:generationRequestId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { generationRequestId } = req.params;
    const clientId = req.user.clientId;

    const generation = await AIGenerationRequest.findOne({
      _id: generationRequestId,
      clientId
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json({ generation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/generations
 * List generations for user
 */
router.get('/generations', authorizationService.requireAuth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, status, generationType, sortBy = 'createdAt', order = 'desc' } = req.query;
    const clientId = req.user.clientId;

    const query = { clientId };
    if (status) query.status = status;
    if (generationType) query.generationType = generationType;

    const generations = await AIGenerationRequest.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await AIGenerationRequest.countDocuments(query);

    res.json({
      generations,
      pagination: {
        skip: parseInt(skip),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generation/:generationRequestId/save-to-blog
 * Save generated content to blog
 */
router.post('/generation/:generationRequestId/save-to-blog', authorizationService.requireAuth, async (req, res) => {
  try {
    const { generationRequestId } = req.params;
    const { blogId, contentType = 'full_content', variantId } = req.body;
    const clientId = req.user.clientId;

    // Get generation request
    const generation = await AIGenerationRequest.findOne({
      _id: generationRequestId,
      clientId
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    let blog;

    if (blogId) {
      // Update existing blog
      blog = await Blog.findOne({ _id: blogId, clientId });
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
    } else {
      // Create new blog
      blog = new Blog({
        clientId,
        author: {
          userId: req.user.userId,
          name: req.user.name,
          email: req.user.email
        },
        createdBy: req.user.userId
      });
    }

    // Update blog with generated content
    const content = generation.generatedContent;

    if (contentType === 'full_content' || contentType === 'all') {
      blog.title = content.title || blog.title;
      blog.excerpt = content.excerpt || blog.excerpt;
      blog.content = content.content || blog.content;
      blog.keywords = content.keywords || blog.keywords;
    } else if (contentType === 'title') {
      blog.title = content.title;
    } else if (contentType === 'excerpt') {
      blog.excerpt = content.excerpt;
    }

    blog.aiGenerated = true;
    blog.generatedBy = {
      model: generation.model,
      generationRequestId: generation._id,
      timestamp: new Date(),
      userPrompt: generation.topic
    };
    blog.aiQualityScore = generation.readabilityMetrics ?
      ContentQualityService.calculateReadabilityScore(blog.content) : 0;

    if (blog.isNew) {
      blog.status = 'draft';
    }

    await blog.save();

    // Update generation request
    generation.action = 'saved_to_blog';
    generation.savedToBlogId = blog._id;
    await generation.save();

    // Log activity
    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'ai_content_saved_to_blog',
      'blog',
      blog._id,
      blog.title,
      { generationRequestId, aiGenerated: true },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blogId: blog._id,
      status: blog.status,
      title: blog.title,
      message: 'Content saved to blog'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generation/:generationRequestId/discard
 * Discard generation
 */
router.post('/generation/:generationRequestId/discard', authorizationService.requireAuth, async (req, res) => {
  try {
    const { generationRequestId } = req.params;
    const { reason } = req.body;
    const clientId = req.user.clientId;

    const generation = await AIGenerationRequest.findOne({
      _id: generationRequestId,
      clientId
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    generation.action = 'discarded';
    generation.discardedAt = new Date();
    generation.discardReason = reason;
    await generation.save();

    res.json({ success: true, message: 'Generation discarded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ai/generation/:generationRequestId/feedback
 * Provide feedback on generation
 */
router.post('/generation/:generationRequestId/feedback', authorizationService.requireAuth, async (req, res) => {
  try {
    const { generationRequestId } = req.params;
    const { rating, feedback, suggestedImprovements } = req.body;
    const clientId = req.user.clientId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1-5' });
    }

    const generation = await AIGenerationRequest.findOne({
      _id: generationRequestId,
      clientId
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    generation.userFeedback = {
      rating,
      feedback,
      suggestedImprovements,
      ratedAt: new Date()
    };
    await generation.save();

    res.json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// CONFIGURATION ENDPOINTS
// ==========================

/**
 * GET /ai/config
 * Get AI configuration
 */
router.get('/config', authorizationService.requireAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;

    let config = await AIGenerationConfig.findOne({ clientId });

    if (!config) {
      // Return default config if none exists
      config = {
        clientId,
        openaiModel: 'gpt-3.5-turbo',
        temperature: 0.7,
        defaultTone: 'professional',
        defaultLanguage: 'en',
        defaultLength: 'medium',
        enableSeoOptimization: true
      };
    }

    // Get current usage
    const quotaStatus = await QuotaService.checkQuota(clientId);

    res.json({
      config,
      currentUsage: {
        tokensUsed: quotaStatus.tokensUsed,
        tokensRemaining: quotaStatus.tokensRemaining,
        generationsUsed: quotaStatus.generationsUsed,
        generationsRemaining: quotaStatus.generationsRemaining
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /ai/config
 * Update AI configuration
 */
router.put('/config', authorizationService.requireAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const {
      openaiApiKey,
      openaiModel,
      temperature,
      maxTokens,
      defaultTone,
      defaultLanguage,
      defaultLength,
      brandVoice,
      contentGuidelines,
      enableSeoOptimization
    } = req.body;

    let config = await AIGenerationConfig.findOne({ clientId });

    if (!config) {
      config = new AIGenerationConfig({ clientId });
    }

    // Update fields if provided
    if (openaiApiKey) config.openaiApiKey = openaiApiKey;
    if (openaiModel) config.openaiModel = openaiModel;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens) config.maxTokens = maxTokens;
    if (defaultTone) config.defaultTone = defaultTone;
    if (defaultLanguage) config.defaultLanguage = defaultLanguage;
    if (defaultLength) config.defaultLength = defaultLength;
    if (brandVoice) config.brandVoice = brandVoice;
    if (contentGuidelines) config.contentGuidelines = contentGuidelines;
    if (enableSeoOptimization !== undefined) config.enableSeoOptimization = enableSeoOptimization;

    config.updatedAt = new Date();
    await config.save();

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/usage
 * Get usage statistics
 */
router.get('/usage', authorizationService.requireAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { month } = req.query;

    const stats = await QuotaService.getUsageStats(clientId, month);
    const dailyBreakdown = await QuotaService.getDailyUsageBreakdown(clientId, month);

    res.json({
      stats,
      dailyBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/prompt-templates
 * List available prompt templates
 */
router.get('/prompt-templates', authorizationService.requireAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;

    const templates = await AIPromptTemplate.find({
      $or: [
        { clientId: null }, // Global templates
        { clientId }       // Client-specific templates
      ],
      isActive: true
    });

    res.json({
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
