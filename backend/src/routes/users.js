const express = require('express');
const authorizationService = require('../services/authorization');
const userManagementService = require('../services/userManagement');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/', authorizationService.requirePermission('user.read'), async (req, res) => {
  try {
    const { limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    const result = await userManagementService.getAllUsers({
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder: parseInt(sortOrder)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/search', authorizationService.requirePermission('user.read'), async (req, res) => {
  try {
    const { query, role, isActive, limit = 50, skip = 0 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await userManagementService.searchUsers(query, {
      role,
      isActive,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authorizationService.requirePermission('user.read'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id !== req.user.userId && !(await authorizationService.hasPermission(req.user.userId, 'user.read'))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const user = await userManagementService.getUserById(id);

    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (id !== req.user.userId && !(await authorizationService.hasPermission(req.user.userId, 'user.edit.all'))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const user = await userManagementService.updateUser(id, req.body, ipAddress, userAgent);

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authorizationService.requirePermission('user.create'), async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await userManagementService.createUser(
      { email, password, name, role, department },
      ipAddress,
      userAgent
    );

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/role', authorizationService.requirePermission('user.create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await userManagementService.assignRole(id, role, req.user.userId, ipAddress, userAgent);

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/deactivate', authorizationService.requirePermission('user.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await userManagementService.deactivateUser(id, req.user.userId, ipAddress, userAgent);

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/activate', authorizationService.requirePermission('user.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await userManagementService.activateUser(id, req.user.userId, ipAddress, userAgent);

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/stats', authorizationService.requirePermission('user.read'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id !== req.user.userId && !(await authorizationService.hasPermission(req.user.userId, 'user.read'))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stats = await userManagementService.getUserStats(id);

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/audit', authorizationService.requirePermission('audit.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, skip = 0, actionType, startDate, endDate } = req.query;

    const logs = await userManagementService.getUserAuditLog(id, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      actionType,
      startDate,
      endDate
    });

    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/bulk/assign-role', authorizationService.requirePermission('user.create'), async (req, res) => {
  try {
    const { userIds, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await userManagementService.bulkAssignRole(userIds, role, req.user.userId, ipAddress, userAgent);

    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/bulk/deactivate', authorizationService.requirePermission('user.delete'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await userManagementService.bulkDeactivateUsers(userIds, req.user.userId, ipAddress, userAgent);

    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
