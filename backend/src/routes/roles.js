const express = require('express');
const authorizationService = require('../services/authorization');
const Role = require('../models/Role');
const UserAudit = require('../models/UserAudit');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.get('/', async (req, res) => {
  try {
    const roles = await Role.find();

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorizationService.requirePermission('role.manage'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !description || !permissions) {
      return res.status(400).json({ error: 'Name, description, and permissions are required' });
    }

    const existingRole = await Role.findOne({ name });

    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    const role = new Role({
      name,
      description,
      permissions,
      isBuiltIn: false
    });

    await role.save();

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await UserAudit.logAction(
      req.user.userId,
      'system_action',
      'role',
      role._id,
      role.name,
      { before: null, after: role.toObject() },
      ipAddress,
      userAgent
    );

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authorizationService.requirePermission('role.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description, permissions } = req.body;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isBuiltIn) {
      return res.status(403).json({ error: 'Cannot edit built-in roles' });
    }

    const before = role.toObject();

    if (description) {
      role.description = description;
    }

    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await UserAudit.logAction(
      req.user.userId,
      'system_action',
      'role',
      role._id,
      role.name,
      { before, after: role.toObject() },
      ipAddress,
      userAgent
    );

    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authorizationService.requirePermission('role.manage'), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isBuiltIn) {
      return res.status(403).json({ error: 'Cannot delete built-in roles' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await UserAudit.logAction(
      req.user.userId,
      'system_action',
      'role',
      role._id,
      role.name,
      { before: role.toObject(), after: null },
      ipAddress,
      userAgent
    );

    await role.deleteOne();

    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
