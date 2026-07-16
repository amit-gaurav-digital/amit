const express = require('express');
const authorizationService = require('../services/authorization');
const customDomainService = require('../services/customDomainService');

const router = express.Router();

router.use(authorizationService.requireAuth);

router.post('/validate', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const result = await customDomainService.validateDomain(domain);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { domain, subdomain, blogId } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const result = await customDomainService.addCustomDomain(
      req.user.userId,
      domain,
      subdomain,
      blogId
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { status } = req.query;

    const domains = await customDomainService.getCustomDomains(
      req.user.userId,
      status || null
    );

    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await customDomainService.getCustomDomain(domainId);

    if (domain.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(domain);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/:domainId/verify', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await customDomainService.getCustomDomain(domainId);

    if (domain.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await customDomainService.verifyDomain(domainId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { isPrimary, redirectHttps, redirectWww, analyticsEnabled } = req.body;

    const domain = await customDomainService.getCustomDomain(domainId);

    if (domain.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates = {};
    if (isPrimary !== undefined) {
      if (isPrimary) {
        const updated = await customDomainService.setPrimaryDomain(req.user.userId, domainId);
        return res.json(updated);
      }
    }

    if (redirectHttps !== undefined) updates.redirectHttps = redirectHttps;
    if (redirectWww !== undefined) updates.redirectWww = redirectWww;
    if (analyticsEnabled !== undefined) updates.analyticsEnabled = analyticsEnabled;

    const updated = await customDomainService.updateCustomDomain(domainId, updates);

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await customDomainService.getCustomDomain(domainId);

    if (domain.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await customDomainService.deleteCustomDomain(domainId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:domainId/stats', async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await customDomainService.getCustomDomain(domainId);

    if (domain.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stats = await customDomainService.getDomainStats(domainId);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-ssl-renewal', authorizationService.requirePermission('admin.settings'), async (req, res) => {
  try {
    const results = await customDomainService.checkSSLRenewal();
    res.json({ renewed: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
