const AIUsageLog = require('../models/AIUsageLog');
const Client = require('../models/Client');

class QuotaService {
  /**
   * Check if user can generate with current quota
   */
  static async checkQuota(clientId, tokensRequired = 0, generationsRequired = 1) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const client = await Client.findById(clientId).select('aiTokensUsedThisMonth aiGenerationsUsedThisMonth aiMonthlyTokenQuota aiMonthlyGenerationQuota');

      if (!client) {
        return { canGenerate: false, error: 'Client not found' };
      }

      const tokensUsed = client.aiTokensUsedThisMonth || 0;
      const generationsUsed = client.aiGenerationsUsedThisMonth || 0;

      const tokenQuota = client.aiMonthlyTokenQuota || 100000;
      const generationQuota = client.aiMonthlyGenerationQuota || 100;

      const tokensRemaining = tokenQuota - tokensUsed;
      const generationsRemaining = generationQuota - generationsUsed;

      return {
        canGenerate: tokensRemaining >= tokensRequired && generationsRemaining >= generationsRequired,
        tokensUsed,
        tokensRemaining,
        tokensQuota,
        generationsUsed,
        generationsRemaining,
        generationQuota,
        quotaExceeded: tokensRemaining < 0 || generationsRemaining < 0
      };
    } catch (error) {
      return { canGenerate: false, error: error.message };
    }
  }

  /**
   * Record usage after successful generation
   */
  static async recordUsage(clientId, userId, tokensUsed, cost, generationType, model, generationRequestId = null) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Create usage log
      const quotaCheck = await this.checkQuota(clientId, tokensUsed);

      const usageLog = new AIUsageLog({
        clientId,
        userId,
        generationRequestId,
        action: 'generate',
        generationType,
        tokensUsed,
        costUsd: cost,
        model,
        monthlyTokensUsed: (quotaCheck.tokensUsed || 0) + tokensUsed,
        monthlyTokensRemaining: (quotaCheck.tokensRemaining || 0) - tokensUsed,
        monthlyGenerationsUsed: (quotaCheck.generationsUsed || 0) + 1,
        monthlyGenerationsRemaining: (quotaCheck.generationsRemaining || 0) - 1,
        quotaExceeded: (quotaCheck.tokensRemaining || 0) - tokensUsed < 0 || (quotaCheck.generationsRemaining || 0) - 1 < 0,
        billingMonth: currentMonth
      });

      await usageLog.save();

      // Update client usage
      const client = await Client.findById(clientId);
      if (client) {
        client.aiTokensUsedThisMonth = (client.aiTokensUsedThisMonth || 0) + tokensUsed;
        client.aiGenerationsUsedThisMonth = (client.aiGenerationsUsedThisMonth || 0) + 1;
        client.aiCostThisMonth = (client.aiCostThisMonth || 0) + cost;
        await client.save();
      }

      return {
        success: true,
        tokensUsed,
        costUsd: cost,
        usageLog
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset monthly quota (called on first day of month)
   */
  static async resetMonthlyQuota(clientId) {
    try {
      const client = await Client.findById(clientId);
      if (client) {
        client.aiTokensUsedThisMonth = 0;
        client.aiGenerationsUsedThisMonth = 0;
        client.aiCostThisMonth = 0;
        await client.save();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get usage statistics for a client
   */
  static async getUsageStats(clientId, month = null) {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      const stats = await AIUsageLog.aggregate([
        {
          $match: {
            clientId: require('mongoose').Types.ObjectId(clientId),
            billingMonth: targetMonth
          }
        },
        {
          $group: {
            _id: null,
            totalTokensUsed: { $sum: '$tokensUsed' },
            totalCostUsd: { $sum: '$costUsd' },
            totalGenerations: { $sum: 1 },
            generationsByType: {
              $push: {
                type: '$generationType',
                tokens: '$tokensUsed',
                cost: '$costUsd'
              }
            }
          }
        }
      ]);

      const client = await Client.findById(clientId).select(
        'aiMonthlyTokenQuota aiMonthlyGenerationQuota aiCostLimit aiTokensUsedThisMonth aiGenerationsUsedThisMonth aiCostThisMonth'
      );

      const usage = stats[0] || {
        totalTokensUsed: 0,
        totalCostUsd: 0,
        totalGenerations: 0,
        generationsByType: []
      };

      return {
        month: targetMonth,
        usage: {
          tokensUsed: usage.totalTokensUsed,
          generationsUsed: usage.totalGenerations,
          costUsd: Number(usage.totalCostUsd.toFixed(2)),
          generationsByType: this.groupByType(usage.generationsByType)
        },
        quota: {
          tokenQuota: client?.aiMonthlyTokenQuota || 100000,
          generationQuota: client?.aiMonthlyGenerationQuota || 100,
          costLimit: client?.aiCostLimit || 500,
          tokensRemaining: (client?.aiMonthlyTokenQuota || 100000) - usage.totalTokensUsed,
          generationsRemaining: (client?.aiMonthlyGenerationQuota || 100) - usage.totalGenerations,
          costRemaining: (client?.aiCostLimit || 500) - usage.totalCostUsd
        },
        percentageUsed: {
          tokens: Math.round((usage.totalTokensUsed / (client?.aiMonthlyTokenQuota || 100000)) * 100),
          generations: Math.round((usage.totalGenerations / (client?.aiMonthlyGenerationQuota || 100)) * 100),
          cost: Math.round((usage.totalCostUsd / (client?.aiCostLimit || 500)) * 100)
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Calculate cost from tokens
   */
  static calculateCost(tokensUsed, model = 'gpt-3.5-turbo') {
    const rates = {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 }
    };

    // Simplified: assume 40% input tokens, 60% output tokens
    const rate = rates[model] || rates['gpt-3.5-turbo'];
    const inputTokens = tokensUsed * 0.4;
    const outputTokens = tokensUsed * 0.6;

    return (
      (inputTokens / 1000 * rate.input) +
      (outputTokens / 1000 * rate.output)
    );
  }

  /**
   * Group usage by generation type
   */
  static groupByType(generationsByType) {
    const grouped = {};

    generationsByType.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = { count: 0, tokensUsed: 0, costUsd: 0 };
      }
      grouped[item.type].count += 1;
      grouped[item.type].tokensUsed += item.tokens;
      grouped[item.type].costUsd += item.cost;
    });

    return grouped;
  }

  /**
   * Get daily usage breakdown
   */
  static async getDailyUsageBreakdown(clientId, month = null) {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const startDate = new Date(`${targetMonth}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const dailyUsage = await AIUsageLog.aggregate([
        {
          $match: {
            clientId: require('mongoose').Types.ObjectId(clientId),
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            tokensUsed: { $sum: '$tokensUsed' },
            costUsd: { $sum: '$costUsd' },
            generationCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return dailyUsage.map(day => ({
        date: day._id,
        tokensUsed: day.tokensUsed,
        costUsd: Number(day.costUsd.toFixed(2)),
        generationCount: day.generationCount
      }));
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = QuotaService;
