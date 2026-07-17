const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const BlogApproval = require('../models/BlogApproval');
const ActivityLog = require('../models/ActivityLog');
const authorizationService = require('../services/authorization');
const mongoose = require('mongoose');

// Helper: Create URL slug from title
function createSlug(title, clientId) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substr(2, 5);
}

// List all blogs with filters
router.get('/', authorizationService.requireAuth, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', search } = req.query;
    const clientId = req.query.clientId || req.user.clientId;

    const query = { clientId, deletedAt: null };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: order === 'desc' ? -1 : 1 };

    const blogs = await Blog.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug excerpt status publishedAt views category tags seoScore featuredImage');

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new blog
router.post('/', authorizationService.requireAuth, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status = 'draft' } = req.body;
    const clientId = req.body.clientId || req.user.clientId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const slug = createSlug(title, clientId);

    const blog = new Blog({
      clientId,
      title,
      slug,
      content: content || '',
      excerpt: excerpt || '',
      category: category || 'Uncategorized',
      tags: tags || [],
      status,
      author: {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email
      },
      createdBy: req.user.userId
    });

    blog.calculateReadTime();
    await blog.save();

    await ActivityLog.logAction(
      clientId,
      req.user.userId,
      'blog_created',
      'blog',
      blog._id,
      title,
      { after: blog.toObject() },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      blog: {
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
        createdAt: blog.createdAt,
        currentVersion: blog.currentVersion
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog details
router.get('/:blogId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog || blog.deletedAt) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({ blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog
router.put('/:blogId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { title, content, excerpt, category, tags, seo } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog || blog.deletedAt) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const changedFields = [];
    if (title && title !== blog.title) {
      blog.title = title;
      changedFields.push('title');
    }
    if (content && content !== blog.content) {
      blog.content = content;
      changedFields.push('content');
    }
    if (excerpt && excerpt !== blog.excerpt) {
      blog.excerpt = excerpt;
      changedFields.push('excerpt');
    }
    if (category && category !== blog.category) {
      blog.category = category;
      changedFields.push('category');
    }
    if (tags) {
      blog.tags = tags;
      changedFields.push('tags');
    }
    if (seo) {
      blog.seo = { ...blog.seo, ...seo };
      changedFields.push('seo');
    }

    if (changedFields.length > 0) {
      blog.calculateReadTime();
      blog.addVersion(blog.toObject(), changedFields, req.user.userId);
      await blog.save();

      await ActivityLog.logAction(
        blog.clientId,
        req.user.userId,
        'blog_updated',
        'blog',
        blog._id,
        blog.title,
        { changedFields },
        req.ip,
        req.headers['user-agent']
      );
    }

    res.json({
      success: true,
      blog,
      versionCreated: blog.currentVersion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog (soft delete)
router.delete('/:blogId', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.deletedAt = new Date();
    await blog.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_deleted',
      'blog',
      blog._id,
      blog.title,
      null,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish blog
router.post('/:blogId/publish', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { immediate = true } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.status = 'published';
    blog.publishedAt = new Date();
    if (blog.scheduledFor) blog.scheduledFor = null;

    await blog.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_published',
      'blog',
      blog._id,
      blog.title,
      { publishedAt: blog.publishedAt },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blog: {
        _id: blog._id,
        status: blog.status,
        publishedAt: blog.publishedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule blog
router.post('/:blogId/schedule', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { publishAt, timezone = 'UTC', recurring } = req.body;

    if (!publishAt) {
      return res.status(400).json({ error: 'publishAt date is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.status = 'scheduled';
    blog.scheduledFor = new Date(publishAt);
    blog.scheduledTimezone = timezone;

    await blog.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_scheduled',
      'blog',
      blog._id,
      blog.title,
      { scheduledFor: blog.scheduledFor, timezone },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blog: {
        _id: blog._id,
        status: blog.status,
        scheduledFor: blog.scheduledFor,
        scheduledTimezone: blog.scheduledTimezone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit for review
router.post('/:blogId/submit-review', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { notes } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.status = 'in_review';
    await blog.save();

    const approval = new BlogApproval({
      blogId: blog._id,
      clientId: blog.clientId,
      submittedBy: req.user.userId,
      submittedAt: new Date(),
      status: 'pending',
      comments: notes ? [{ commentedBy: req.user.userId, text: notes }] : []
    });

    await approval.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_submitted_review',
      'blog',
      blog._id,
      blog.title,
      null,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blog: { _id: blog._id, status: blog.status }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog versions
router.get('/:blogId/versions', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({
      versions: blog.versionHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore blog version
router.post('/:blogId/restore-version', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { versionNumber } = req.body;

    if (!versionNumber) {
      return res.status(400).json({ error: 'versionNumber is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const version = blog.versionHistory.find(v => v.versionNumber === versionNumber);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    blog.title = version.title;
    blog.content = version.content;
    blog.calculateReadTime();
    blog.addVersion(blog.toObject(), ['title', 'content'], req.user.userId);

    await blog.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_restored',
      'blog',
      blog._id,
      blog.title,
      { restoredFromVersion: versionNumber },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blog,
      newVersion: blog.currentVersion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
