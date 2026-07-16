const CustomDomain = require('../models/CustomDomain');
const crypto = require('crypto');
const dns = require('dns').promises;

class CustomDomainService {
  async addCustomDomain(userId, domain, subdomain = null, blogId = null) {
    try {
      const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

      const existing = await CustomDomain.findOne({ fullDomain });
      if (existing) {
        throw new Error('This domain is already in use');
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      const customDomain = new CustomDomain({
        userId,
        domain,
        subdomain,
        fullDomain,
        blogId,
        verificationToken,
        dnsRecords: {
          cname: `${verificationToken}.${process.env.APP_DOMAIN || 'blogging-platform.com'}`,
          txt: `v=blogging-platform ${verificationToken}`,
          ttl: 3600
        }
      });

      await customDomain.save();

      return {
        domainId: customDomain._id,
        domain: customDomain.fullDomain,
        status: 'pending',
        verificationMethod: customDomain.verificationMethod,
        dnsRecords: customDomain.dnsRecords
      };
    } catch (error) {
      throw new Error(`Failed to add custom domain: ${error.message}`);
    }
  }

  async verifyDomain(domainId) {
    try {
      const customDomain = await CustomDomain.findById(domainId);

      if (!customDomain) {
        throw new Error('Domain not found');
      }

      if (customDomain.status === 'active') {
        return { verified: true, status: 'active' };
      }

      customDomain.status = 'verifying';
      await customDomain.save();

      try {
        let verified = false;

        if (customDomain.verificationMethod === 'cname') {
          verified = await this.verifyCNAME(customDomain.fullDomain, customDomain.dnsRecords.cname);
        } else if (customDomain.verificationMethod === 'txt') {
          verified = await this.verifyTXT(customDomain.fullDomain, customDomain.dnsRecords.txt);
        }

        if (verified) {
          customDomain.status = 'verified';
          customDomain.lastVerificationAt = new Date();
          customDomain.verificationRetryCount = 0;

          await this.setupSSLCertificate(customDomain);

          customDomain.sslCertificate.issuedAt = new Date();
          customDomain.sslCertificate.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

          customDomain.status = 'active';
          customDomain.isActive = true;
          await customDomain.save();

          return {
            verified: true,
            status: 'active',
            domain: customDomain.fullDomain,
            sslCertificate: {
              issuedAt: customDomain.sslCertificate.issuedAt,
              expiresAt: customDomain.sslCertificate.expiresAt
            }
          };
        } else {
          customDomain.status = 'failed';
          customDomain.verificationRetryCount += 1;
          customDomain.verificationFailureReason = 'DNS verification failed';
          await customDomain.save();

          return {
            verified: false,
            status: 'failed',
            reason: 'DNS records not found or not configured correctly'
          };
        }
      } catch (error) {
        customDomain.status = 'failed';
        customDomain.verificationFailureReason = error.message;
        customDomain.verificationRetryCount += 1;
        await customDomain.save();

        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to verify domain: ${error.message}`);
    }
  }

  async verifyCNAME(domain, expectedCname) {
    try {
      const cnames = await dns.resolveCname(domain);
      return cnames.some(cname => cname === expectedCname || cname.endsWith(expectedCname));
    } catch (error) {
      console.error('CNAME verification error:', error.message);
      return false;
    }
  }

  async verifyTXT(domain, expectedTxt) {
    try {
      const records = await dns.resolveTxt(domain);
      return records.some(record => record.join('').includes(expectedTxt));
    } catch (error) {
      console.error('TXT verification error:', error.message);
      return false;
    }
  }

  async setupSSLCertificate(customDomain) {
    try {
      customDomain.sslCertificate = {
        provider: 'letsencrypt',
        issuer: "Let's Encrypt",
        autoRenew: true,
        certificatePath: `/etc/letsencrypt/live/${customDomain.fullDomain}/fullchain.pem`
      };

      return customDomain.sslCertificate;
    } catch (error) {
      console.error('SSL setup error:', error.message);
      throw error;
    }
  }

  async getCustomDomains(userId, status = null) {
    try {
      const query = { userId };
      if (status) query.status = status;

      const domains = await CustomDomain.find(query).sort({ createdAt: -1 });
      return domains.map(d => d.toObject());
    } catch (error) {
      throw new Error(`Failed to get custom domains: ${error.message}`);
    }
  }

  async getCustomDomain(domainId) {
    try {
      const domain = await CustomDomain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }
      return domain.toObject();
    } catch (error) {
      throw new Error(`Failed to get custom domain: ${error.message}`);
    }
  }

  async updateCustomDomain(domainId, updates) {
    try {
      const domain = await CustomDomain.findByIdAndUpdate(
        domainId,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!domain) {
        throw new Error('Domain not found');
      }

      return domain.toObject();
    } catch (error) {
      throw new Error(`Failed to update custom domain: ${error.message}`);
    }
  }

  async deleteCustomDomain(domainId) {
    try {
      const domain = await CustomDomain.findByIdAndDelete(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      return { success: true, domain: domain.fullDomain };
    } catch (error) {
      throw new Error(`Failed to delete custom domain: ${error.message}`);
    }
  }

  async setPrimaryDomain(userId, domainId) {
    try {
      await CustomDomain.updateMany(
        { userId },
        { isPrimary: false }
      );

      const domain = await CustomDomain.findByIdAndUpdate(
        domainId,
        { isPrimary: true },
        { new: true }
      );

      if (!domain) {
        throw new Error('Domain not found');
      }

      return domain.toObject();
    } catch (error) {
      throw new Error(`Failed to set primary domain: ${error.message}`);
    }
  }

  async checkSSLRenewal() {
    try {
      const expiringSoon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const domains = await CustomDomain.find({
        status: 'active',
        'sslCertificate.autoRenew': true,
        'sslCertificate.expiresAt': { $lt: expiringSoon }
      });

      const results = [];

      for (const domain of domains) {
        try {
          await this.renewSSLCertificate(domain);
          results.push({ domain: domain.fullDomain, status: 'renewed' });
        } catch (error) {
          results.push({ domain: domain.fullDomain, status: 'failed', error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to check SSL renewal: ${error.message}`);
    }
  }

  async renewSSLCertificate(domain) {
    try {
      domain.sslCertificate.issuedAt = new Date();
      domain.sslCertificate.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await domain.save();

      return {
        domain: domain.fullDomain,
        renewedAt: domain.sslCertificate.issuedAt,
        expiresAt: domain.sslCertificate.expiresAt
      };
    } catch (error) {
      throw new Error(`Failed to renew SSL: ${error.message}`);
    }
  }

  async validateDomain(domain) {
    try {
      if (!domain || domain.length === 0) {
        throw new Error('Domain is required');
      }

      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        throw new Error('Invalid domain format');
      }

      const existing = await CustomDomain.findOne({ domain: domain.toLowerCase() });
      if (existing) {
        throw new Error('This domain is already in use');
      }

      return { valid: true, domain: domain.toLowerCase() };
    } catch (error) {
      throw new Error(`Domain validation failed: ${error.message}`);
    }
  }

  async getDomainStats(domainId) {
    try {
      const domain = await CustomDomain.findById(domainId);

      if (!domain) {
        throw new Error('Domain not found');
      }

      return {
        domain: domain.fullDomain,
        status: domain.status,
        viewCount: domain.viewCount,
        isActive: domain.isActive,
        isPrimary: domain.isPrimary,
        createdAt: domain.createdAt,
        sslStatus: domain.sslCertificate?.expiresAt
          ? {
              isActive: domain.sslCertificate.expiresAt > new Date(),
              expiresAt: domain.sslCertificate.expiresAt,
              provider: domain.sslCertificate.provider
            }
          : null
      };
    } catch (error) {
      throw new Error(`Failed to get domain stats: ${error.message}`);
    }
  }

  async recordDomainView(domain) {
    try {
      await CustomDomain.findOneAndUpdate(
        { fullDomain: domain },
        { $inc: { viewCount: 1 } }
      );
    } catch (error) {
      console.error('Failed to record domain view:', error.message);
    }
  }
}

module.exports = new CustomDomainService();
