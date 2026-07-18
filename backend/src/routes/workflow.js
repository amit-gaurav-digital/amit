const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const BlogWorkflow = require('../models/BlogWorkflow');
const WorkflowNotification = require('../models/WorkflowNotification');
const ActivityLog = require('../models/ActivityLog');
const authorizationService = require('../services/authorization');
const mongoose = require('mongoose');

// Helper: Send workflow notification
async function sendNotification(type, blogId, clientId, recipientId, data = {}) {
  try {
    const notification = new WorkflowNotification({
      blogId,
      clientId,
      type,
      recipientId,
      subject: data.subject || '',
      message: data.message || '',
      actionUrl: data.actionUrl || '',
      channels: {
        inApp: { status: 'pending' }
      }
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper: Check reviewer permissions
function canReview(user, blog) {
  const canReviewRoles = ['reviewer', 'approver', 'admin'];
  return user.role && canReviewRoles.includes(user.role);
}

// Helper: Check approver permissions
function canApprove(user, blog) {
  const canApproveRoles = ['approver', 'admin'];
  return user.role && canApproveRoles.includes(user.role);
}

// GET: Get workflow details
router.get('/blogs/:blogId/workflow', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const workflow = await BlogWorkflow.findOne({ blogId })
      .populate('reviewers.userId', 'name email role')
      .populate('approvers.userId', 'name email role')
      .populate('comments.author.userId', 'name email role');

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Submit blog for review
router.post('/blogs/:blogId/workflow/submit-review', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { reviewers: reviewerIds, notes, priority = 'normal' } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft blogs can be submitted for review' });
    }

    // Create or update workflow
    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      workflow = new BlogWorkflow({
        blogId,
        clientId: blog.clientId,
        currentStage: 'in_review'
      });
    } else {
      workflow.currentStage = 'in_review';
    }

    workflow.submittedForReviewAt = new Date();
    workflow.stage = {
      name: 'in_review',
      enteredBy: req.user.userId,
      enteredAt: new Date(),
      priority
    };

    // Add reviewers
    if (reviewerIds && reviewerIds.length > 0) {
      workflow.reviewers = reviewerIds.map(userId => ({
        userId,
        assignedAt: new Date(),
        assignedBy: req.user.userId,
        status: 'pending'
      }));

      // Send notifications to reviewers
      for (const reviewerId of reviewerIds) {
        await sendNotification('reviewer_assigned', blogId, blog.clientId, reviewerId, {
          subject: `Review Requested: "${blog.title}"`,
          message: `${req.user.name} requested your review on "${blog.title}"`,
          actionUrl: `/dashboard/blogs/${blogId}/review`
        });
      }
    }

    if (notes) {
      workflow.comments.push({
        commentId: new mongoose.Types.ObjectId(),
        author: {
          userId: req.user.userId,
          name: req.user.name,
          role: req.user.role
        },
        text: notes,
        createdAt: new Date()
      });
    }

    await workflow.save();

    // Update blog status
    blog.status = 'in_review';
    blog.approvalStatus = 'pending';
    blog.workflowId = workflow._id;
    await blog.save();

    // Log activity
    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_submitted_review',
      'blog',
      blog._id,
      blog.title,
      { reviewersAssigned: reviewerIds?.length || 0 },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      workflow: {
        _id: workflow._id,
        currentStage: workflow.currentStage,
        reviewers: workflow.reviewers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Add comment to workflow
router.post('/blogs/:blogId/workflow/comments', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { text, mentions = [] } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      workflow = new BlogWorkflow({
        blogId,
        clientId: blog.clientId
      });
    }

    const comment = {
      commentId: new mongoose.Types.ObjectId(),
      author: {
        userId: req.user.userId,
        name: req.user.name,
        role: req.user.role
      },
      text,
      mentions,
      createdAt: new Date()
    };

    workflow.comments.push(comment);
    await workflow.save();

    // Notify mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== req.user.userId.toString()) {
        await sendNotification('comment_mention', blogId, blog.clientId, mentionedUserId, {
          subject: `${req.user.name} mentioned you`,
          message: `${req.user.name} mentioned you in a comment`,
          actionUrl: `/dashboard/blogs/${blogId}/comments`
        });
      }
    }

    res.json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Request changes
router.post('/blogs/:blogId/workflow/request-changes', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { description, section, priority = 'medium' } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Change request description is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!canReview(req.user, blog)) {
      return res.status(403).json({ error: 'Not authorized to request changes' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const changeRequest = {
      id: new mongoose.Types.ObjectId(),
      requestedBy: req.user.userId,
      requestedAt: new Date(),
      priority,
      description,
      section,
      status: 'pending'
    };

    workflow.changeRequests.push(changeRequest);

    // Update reviewer status
    const reviewerIndex = workflow.reviewers.findIndex(r => r.userId.toString() === req.user.userId.toString());
    if (reviewerIndex >= 0) {
      workflow.reviewers[reviewerIndex].status = 'changes_requested';
      workflow.reviewers[reviewerIndex].feedback = description;
      workflow.reviewers[reviewerIndex].completedAt = new Date();
    }

    await workflow.save();

    // Update blog approval status
    blog.approvalStatus = 'changes_requested';
    await blog.save();

    // Notify blog author
    await sendNotification('changes_requested', blogId, blog.clientId, blog.author.userId, {
      subject: `Changes Requested: "${blog.title}"`,
      message: `${req.user.name} requested changes to your blog`,
      actionUrl: `/dashboard/blogs/${blogId}/review`
    });

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_changes_requested',
      'blog',
      blog._id,
      blog.title,
      { changeReason: description },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      changeRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Approve blog
router.post('/blogs/:blogId/workflow/approve', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { feedback } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!canReview(req.user, blog)) {
      return res.status(403).json({ error: 'Not authorized to approve' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Update reviewer status
    const reviewerIndex = workflow.reviewers.findIndex(r => r.userId.toString() === req.user.userId.toString());
    if (reviewerIndex >= 0) {
      workflow.reviewers[reviewerIndex].status = 'approved';
      workflow.reviewers[reviewerIndex].feedback = feedback;
      workflow.reviewers[reviewerIndex].completedAt = new Date();
    }

    // Check if all reviewers have approved
    const allApproved = workflow.reviewers.every(r => r.status === 'approved');
    if (allApproved) {
      workflow.currentStage = 'approved';
      workflow.approvedAt = new Date();
      blog.status = 'approved';
      blog.approvalStatus = 'approved';
    }

    await workflow.save();
    await blog.save();

    // Notify author
    await sendNotification('approved', blogId, blog.clientId, blog.author.userId, {
      subject: `Review Approved: "${blog.title}"`,
      message: `${req.user.name} approved your blog`,
      actionUrl: `/dashboard/blogs/${blogId}`
    });

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_approved',
      'blog',
      blog._id,
      blog.title,
      { reviewer: req.user.name },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      workflow: {
        currentStage: workflow.currentStage,
        reviewers: workflow.reviewers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Reject blog
router.post('/blogs/:blogId/workflow/reject', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!canApprove(req.user, blog)) {
      return res.status(403).json({ error: 'Not authorized to reject' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.currentStage = 'rejected';
    workflow.rejectionReason = reason;
    workflow.rejectedBy = req.user.userId;
    workflow.rejectedAt = new Date();

    await workflow.save();

    blog.status = 'draft';
    blog.approvalStatus = 'rejected';
    await blog.save();

    // Notify author
    await sendNotification('rejected', blogId, blog.clientId, blog.author.userId, {
      subject: `Blog Rejected: "${blog.title}"`,
      message: `${req.user.name} rejected your blog`,
      actionUrl: `/dashboard/blogs/${blogId}/review`
    });

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_rejected',
      'blog',
      blog._id,
      blog.title,
      { reason },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      workflow: {
        currentStage: workflow.currentStage,
        rejectionReason: workflow.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Publish blog
router.post('/blogs/:blogId/workflow/publish', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!canApprove(req.user, blog)) {
      return res.status(403).json({ error: 'Not authorized to publish' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.currentStage = 'published';
    workflow.publishedAt = new Date();
    await workflow.save();

    blog.status = 'published';
    blog.publishedAt = new Date();
    blog.approvalStatus = 'approved';
    await blog.save();

    // Notify author
    await sendNotification('published', blogId, blog.clientId, blog.author.userId, {
      subject: `Blog Published: "${blog.title}"`,
      message: `Your blog "${blog.title}" has been published!`,
      actionUrl: `/dashboard/blogs/${blogId}`
    });

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'blog_published',
      'blog',
      blog._id,
      blog.title,
      { publisher: req.user.name },
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

// POST: Schedule publish
router.post('/blogs/:blogId/workflow/schedule-publish', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { publishAt, timezone = 'UTC' } = req.body;

    if (!publishAt) {
      return res.status(400).json({ error: 'publishAt date is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!canApprove(req.user, blog)) {
      return res.status(403).json({ error: 'Not authorized to schedule' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
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
      { scheduledFor: publishAt, timezone },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      blog: {
        _id: blog._id,
        status: blog.status,
        scheduledFor: blog.scheduledFor
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Reassign reviewers
router.post('/blogs/:blogId/workflow/reviewers/reassign', authorizationService.requireAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { oldReviewerId, newReviewerId } = req.body;

    if (!oldReviewerId || !newReviewerId) {
      return res.status(400).json({ error: 'Both old and new reviewer IDs are required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'approver') {
      return res.status(403).json({ error: 'Not authorized to reassign reviewers' });
    }

    let workflow = await BlogWorkflow.findOne({ blogId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const reviewerIndex = workflow.reviewers.findIndex(r => r.userId.toString() === oldReviewerId);
    if (reviewerIndex >= 0) {
      workflow.reviewers[reviewerIndex].userId = newReviewerId;
      workflow.reviewers[reviewerIndex].assignedAt = new Date();
      workflow.reviewers[reviewerIndex].status = 'pending';
    }

    await workflow.save();

    await ActivityLog.logAction(
      blog.clientId,
      req.user.userId,
      'reviewer_reassigned',
      'blog',
      blog._id,
      blog.title,
      { oldReviewerId, newReviewerId },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      reviewers: workflow.reviewers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Get workflow analytics
router.get('/workflow/analytics', authorizationService.requireAuth, async (req, res) => {
  try {
    const clientId = req.query.clientId || req.user.userId;

    const workflows = await BlogWorkflow.find({ clientId });

    const analytics = {
      totalWorkflows: workflows.length,
      byStage: {
        draft: workflows.filter(w => w.currentStage === 'draft').length,
        in_review: workflows.filter(w => w.currentStage === 'in_review').length,
        approved: workflows.filter(w => w.currentStage === 'approved').length,
        published: workflows.filter(w => w.currentStage === 'published').length,
        rejected: workflows.filter(w => w.currentStage === 'rejected').length
      },
      averageReviewTime: calculateAverageReviewTime(workflows),
      pendingReviews: workflows.filter(w => w.currentStage === 'in_review').length
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateAverageReviewTime(workflows) {
  const completedReviews = workflows.filter(w => w.reviewCompletedAt);
  if (completedReviews.length === 0) return 0;

  const totalTime = completedReviews.reduce((acc, w) => {
    const time = new Date(w.reviewCompletedAt) - new Date(w.submittedForReviewAt);
    return acc + time;
  }, 0);

  const averageMs = totalTime / completedReviews.length;
  return Math.round(averageMs / (1000 * 60 * 60 * 24)); // in days
}

module.exports = router;
