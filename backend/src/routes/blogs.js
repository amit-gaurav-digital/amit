const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const authorizationService = require('../services/authorization');

const requireAuth = authorizationService.requireAuth;
const requirePermission = (permission) => authorizationService.requirePermission(permission);

router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('title description featuredImage slug createdBy createdAt views')
      .populate('createdBy', 'name email')
      .limit(20);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, requirePermission('blog.create'), async (req, res) => {
  try {
    const blog = new Blog({
      ...req.body,
      createdBy: req.user.userId
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const canEdit = await authorizationService.canEditBlog(req.user.userId, req.params.id);
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this blog' });
    }

    Object.assign(blog, req.body);
    blog.updatedAt = new Date();
    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const canDelete = await authorizationService.canDeleteBlog(req.user.userId, req.params.id);
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
