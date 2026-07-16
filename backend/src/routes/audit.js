const express = require('express');
const authorizationService = require('../services/authorization');
const UserAudit = require('../models/UserAudit');

const router = express.Router();

router.use(authorizationService.requireAuth);
router.use(authorizationService.requirePermission('audit.view'));

router.get('/', async (req, res) => {
  try {
    const {
      limit = 50,
      skip = 0,
      userId,
      actionType,
      resourceType,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await UserAudit.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await UserAudit.countDocuments(query);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await UserAudit.find({ userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await UserAudit.countDocuments({ userId });

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resource/:resourceType/:resourceId', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await UserAudit.find({ resourceType, resourceId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await UserAudit.countDocuments({ resourceType, resourceId });

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const actionCounts = await UserAudit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const userCounts = await UserAudit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    const resourceCounts = await UserAudit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$resourceType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      timeRange: { days: parseInt(days), startDate },
      actionCounts,
      topUsers: userCounts,
      resourceCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await UserAudit.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const timeline = logs.map(log => ({
      id: log._id,
      user: log.userId?.name || 'Unknown',
      action: log.actionType,
      resource: log.resourceType,
      timestamp: log.createdAt,
      status: log.status
    }));

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
