const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const BillingHistory = require('../models/BillingHistory');

class SubscriptionService {
  async initializeDefaultPlans() {
    try {
      const defaultPlans = [
        {
          name: 'Free',
          slug: 'free',
          description: 'Get started with basic blogging features',
          tier: 0,
          displayOrder: 1,
          isActive: true,
          pricing: { monthlyPrice: 0 },
          features: [
            { name: 'Blogs per Month', limit: 5, unlimited: false },
            { name: 'Custom Domain', limit: 0, unlimited: false },
            { name: 'Social Media Accounts', limit: 1, unlimited: false },
            { name: 'Storage', limit: 1, unlimited: false },
            { name: 'Translations', limit: 2, unlimited: false },
            { name: 'Team Members', limit: 1, unlimited: false }
          ],
          limits: {
            monthlyBlogs: 5,
            monthlyTranslations: 2,
            customDomains: 0,
            socialMediaAccounts: 1,
            storageGB: 1,
            teamMembers: 1,
            apiCallsPerMonth: 1000
          },
          benefits: ['Basic analytics', 'Email support', 'Community access'],
          support: 'email'
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'For serious bloggers and small teams',
          tier: 1,
          displayOrder: 2,
          isActive: true,
          pricing: { monthlyPrice: 29, yearlyPrice: 290 },
          features: [
            { name: 'Blogs per Month', limit: 100, unlimited: false },
            { name: 'Custom Domain', limit: 3, unlimited: false },
            { name: 'Social Media Accounts', limit: 5, unlimited: false },
            { name: 'Storage', limit: 50, unlimited: false },
            { name: 'Translations', limit: 50, unlimited: false },
            { name: 'Team Members', limit: 5, unlimited: false }
          ],
          limits: {
            monthlyBlogs: 100,
            monthlyTranslations: 50,
            customDomains: 3,
            socialMediaAccounts: 5,
            storageGB: 50,
            teamMembers: 5,
            apiCallsPerMonth: 100000
          },
          benefits: ['Advanced analytics', 'Priority email support', 'API access', 'Custom CSS'],
          support: 'priority'
        },
        {
          name: 'Business',
          slug: 'business',
          description: 'For large teams and organizations',
          tier: 2,
          displayOrder: 3,
          isActive: true,
          pricing: { monthlyPrice: 99, yearlyPrice: 990 },
          features: [
            { name: 'Blogs per Month', limit: 0, unlimited: true },
            { name: 'Custom Domain', limit: 0, unlimited: true },
            { name: 'Social Media Accounts', limit: 0, unlimited: true },
            { name: 'Storage', limit: 0, unlimited: true },
            { name: 'Translations', limit: 0, unlimited: true },
            { name: 'Team Members', limit: 0, unlimited: true }
          ],
          limits: {
            monthlyBlogs: -1,
            monthlyTranslations: -1,
            customDomains: -1,
            socialMediaAccounts: -1,
            storageGB: -1,
            teamMembers: -1,
            apiCallsPerMonth: -1
          },
          benefits: ['Full analytics', 'Dedicated support', 'API access', 'Custom integrations', 'White label options'],
          support: 'dedicated'
        }
      ];

      for (const plan of defaultPlans) {
        await SubscriptionPlan.findOneAndUpdate(
          { slug: plan.slug },
          plan,
          { upsert: true }
        );
      }

      console.log('Subscription plans initialized');
    } catch (error) {
      console.error('Failed to initialize subscription plans:', error.message);
    }
  }

  async getAvailablePlans() {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
      return plans.map(p => p.toObject());
    } catch (error) {
      throw new Error(`Failed to get plans: ${error.message}`);
    }
  }

  async getUserSubscription(userId) {
    try {
      let subscription = await UserSubscription.findOne({ userId })
        .populate('planId');

      if (!subscription) {
        const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
        subscription = new UserSubscription({
          userId,
          planId: freePlan._id,
          status: 'active',
          billingCycle: 'monthly'
        });
        await subscription.save();
        await subscription.populate('planId');
      }

      return subscription.toObject();
    } catch (error) {
      throw new Error(`Failed to get user subscription: ${error.message}`);
    }
  }

  async upgradePlan(userId, newPlanId, billingCycle = 'monthly') {
    try {
      const newPlan = await SubscriptionPlan.findById(newPlanId);
      if (!newPlan) {
        throw new Error('Plan not found');
      }

      let subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        throw new Error('User subscription not found');
      }

      const oldPlanId = subscription.planId;
      subscription.planId = newPlanId;
      subscription.billingCycle = billingCycle;
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = this.calculatePeriodEnd(billingCycle);
      subscription.upgradedAt = new Date();
      subscription.autoRenew = true;

      await subscription.save();

      const oldPlan = await SubscriptionPlan.findById(oldPlanId);
      await BillingHistory.create({
        userId,
        subscriptionId: subscription._id,
        invoiceType: 'upgrade',
        status: 'paid',
        amount: newPlan.pricing.monthlyPrice,
        currency: newPlan.pricing.currency,
        description: `Upgrade from ${oldPlan.name} to ${newPlan.name}`,
        planName: newPlan.name,
        billingCycle,
        paidAt: new Date()
      });

      await subscription.populate('planId');
      return subscription.toObject();
    } catch (error) {
      throw new Error(`Failed to upgrade plan: ${error.message}`);
    }
  }

  async downgradePlan(userId, newPlanId, billingCycle = 'monthly') {
    try {
      const newPlan = await SubscriptionPlan.findById(newPlanId);
      if (!newPlan) {
        throw new Error('Plan not found');
      }

      let subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        throw new Error('User subscription not found');
      }

      const oldPlanId = subscription.planId;
      subscription.planId = newPlanId;
      subscription.billingCycle = billingCycle;
      subscription.downgradedAt = new Date();

      await subscription.save();

      const oldPlan = await SubscriptionPlan.findById(oldPlanId);
      await BillingHistory.create({
        userId,
        subscriptionId: subscription._id,
        invoiceType: 'downgrade',
        status: 'paid',
        amount: newPlan.pricing.monthlyPrice,
        currency: newPlan.pricing.currency,
        description: `Downgrade from ${oldPlan.name} to ${newPlan.name}`,
        planName: newPlan.name,
        billingCycle,
        paidAt: new Date()
      });

      await subscription.populate('planId');
      return subscription.toObject();
    } catch (error) {
      throw new Error(`Failed to downgrade plan: ${error.message}`);
    }
  }

  async cancelSubscription(userId, reason = null) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });

      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
      subscription.cancelReason = reason;
      subscription.planId = freePlan._id;
      subscription.autoRenew = false;

      await subscription.save();

      await subscription.populate('planId');
      return subscription.toObject();
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async checkFeatureAccess(userId, feature) {
    try {
      const subscription = await UserSubscription.findOne({ userId })
        .populate('planId');

      if (!subscription) {
        return false;
      }

      const plan = subscription.planId;
      const limit = plan.limits[feature];

      if (limit === -1) {
        return true;
      }

      if (limit === 0) {
        return false;
      }

      const usageKey = this.getUsageKey(feature);
      const currentUsage = subscription.usageStats[usageKey] || 0;

      return currentUsage < limit;
    } catch (error) {
      console.error('Feature access check error:', error.message);
      return false;
    }
  }

  async recordUsage(userId, feature) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      if (!subscription) return;

      const usageKey = this.getUsageKey(feature);
      if (subscription.usageStats[usageKey] !== undefined) {
        subscription.usageStats[usageKey] += 1;
        await subscription.save();
      }
    } catch (error) {
      console.error('Failed to record usage:', error.message);
    }
  }

  async getUsageStats(userId) {
    try {
      const subscription = await UserSubscription.findOne({ userId })
        .populate('planId');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return {
        plan: subscription.planId.name,
        usage: subscription.usageStats,
        limits: subscription.planId.limits
      };
    } catch (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }
  }

  async getBillingHistory(userId, limit = 20, skip = 0) {
    try {
      const history = await BillingHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await BillingHistory.countDocuments({ userId });

      return {
        history: history.map(h => h.toObject()),
        total,
        limit,
        skip
      };
    } catch (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }
  }

  getUsageKey(feature) {
    const mapping = {
      monthlyBlogs: 'blogsCreatedThisMonth',
      monthlyTranslations: 'translationsThisMonth',
      storageGB: 'storageUsedGB',
      apiCallsPerMonth: 'apiCallsThisMonth',
      socialMediaAccounts: 'socialPostsThisMonth'
    };

    return mapping[feature] || feature;
  }

  calculatePeriodEnd(billingCycle) {
    const now = new Date();
    if (billingCycle === 'yearly') {
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else {
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }

  async resetMonthlyUsage() {
    try {
      const result = await UserSubscription.updateMany(
        {},
        {
          $set: {
            'usageStats.blogsCreatedThisMonth': 0,
            'usageStats.translationsThisMonth': 0,
            'usageStats.apiCallsThisMonth': 0,
            'usageStats.socialPostsThisMonth': 0
          }
        }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new Error(`Failed to reset usage: ${error.message}`);
    }
  }
}

module.exports = new SubscriptionService();
