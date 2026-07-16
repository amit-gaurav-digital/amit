const ABTest = require('../models/ABTest');
const ABTestResult = require('../models/ABTestResult');
const mongoose = require('mongoose');

class ABTestingService {
  async createTest(testData) {
    try {
      const {
        blogId,
        name,
        description,
        testType,
        testField,
        variants,
        configuration,
        createdBy
      } = testData;

      const variantsWithIds = variants.map(v => ({
        _id: new mongoose.Types.ObjectId(),
        ...v
      }));

      const test = new ABTest({
        blogId,
        name,
        description,
        testType,
        testField,
        variants: variantsWithIds,
        configuration,
        createdBy
      });

      await test.save();

      for (const variant of variantsWithIds) {
        await ABTestResult.create({
          testId: test._id,
          variantId: variant._id,
          variantName: variant.name
        });
      }

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to create A/B test: ${error.message}`);
    }
  }

  async startTest(testId) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'draft') {
        throw new Error('Can only start tests in draft status');
      }

      test.status = 'running';
      test.results.status = 'running';
      test.results.startedAt = new Date();

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + test.configuration.duration);

      test.variants.forEach(v => {
        v.startDate = new Date();
        v.endDate = endDate;
      });

      await test.save();

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to start test: ${error.message}`);
    }
  }

  async stopTest(testId) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'running') {
        throw new Error('Only running tests can be stopped');
      }

      test.status = 'paused';
      await test.save();

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to stop test: ${error.message}`);
    }
  }

  async completeTest(testId, autoSelect = false) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      test.status = 'completed';
      test.results.status = 'completed';
      test.results.completedAt = new Date();

      if (autoSelect || test.configuration.autoSelect) {
        const winner = await this.analyzeResults(testId);
        if (winner) {
          test.results.winner = winner;
        }
      }

      await test.save();

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to complete test: ${error.message}`);
    }
  }

  async analyzeResults(testId) {
    try {
      const results = await ABTestResult.find({ testId });

      if (results.length < 2) {
        return null;
      }

      results.forEach(r => r.calculateMetrics());

      const analysis = results.map(r => ({
        variantId: r.variantId,
        variantName: r.variantName,
        conversions: r.metrics.conversions,
        views: r.metrics.views,
        conversionRate: r.calculations.conversionRate,
        clickThroughRate: r.calculations.clickThroughRate,
        bounceRate: r.calculations.bounceRate
      }));

      analysis.sort((a, b) => b.conversionRate - a.conversionRate);

      const controlVariant = analysis[0];
      const testVariant = analysis[1];

      const zScore = this.calculateZScore(controlVariant, testVariant);
      const pValue = this.calculatePValue(zScore);
      const improvement = (
        (testVariant.conversionRate - controlVariant.conversionRate) /
        controlVariant.conversionRate
      ) * 100;

      const isSignificant = pValue < 0.05;

      if (isSignificant) {
        return {
          variantId: controlVariant.variantId,
          variantName: controlVariant.variantName,
          improvement: Math.abs(improvement),
          significanceLevel: 1 - pValue,
          selectedAt: new Date()
        };
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to analyze results: ${error.message}`);
    }
  }

  async getTestResults(testId) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      const results = await ABTestResult.find({ testId });

      const summary = results.map(r => ({
        variantId: r.variantId,
        variantName: r.variantName,
        metrics: r.metrics,
        calculations: r.calculations,
        dailyMetrics: r.dailyMetrics
      }));

      return {
        test: test.toObject(),
        results: summary
      };
    } catch (error) {
      throw new Error(`Failed to get test results: ${error.message}`);
    }
  }

  async recordEvent(testId, variantId, eventType, data = {}) {
    try {
      await ABTestResult.recordEvent(testId, variantId, eventType, data);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to record event: ${error.message}`);
    }
  }

  async getTestsForBlog(blogId, status = null) {
    try {
      const query = { blogId };

      if (status) {
        query.status = status;
      }

      const tests = await ABTest.find(query).sort({ createdAt: -1 });

      return tests.map(t => t.toObject());
    } catch (error) {
      throw new Error(`Failed to get tests: ${error.message}`);
    }
  }

  async getActiveTests(blogId) {
    try {
      const tests = await ABTest.find({
        blogId,
        status: { $in: ['running', 'paused'] }
      });

      return tests.map(t => t.toObject());
    } catch (error) {
      throw new Error(`Failed to get active tests: ${error.message}`);
    }
  }

  async updateTestConfiguration(testId, configuration) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'draft') {
        throw new Error('Can only update configuration of draft tests');
      }

      test.configuration = { ...test.configuration, ...configuration };
      await test.save();

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error.message}`);
    }
  }

  async cancelTest(testId) {
    try {
      const test = await ABTest.findById(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      test.status = 'cancelled';
      await test.save();

      return test.toObject();
    } catch (error) {
      throw new Error(`Failed to cancel test: ${error.message}`);
    }
  }

  calculateZScore(variant1, variant2) {
    const p1 = variant1.conversionRate / 100;
    const p2 = variant2.conversionRate / 100;
    const n1 = variant1.views;
    const n2 = variant2.views;

    const pooledP = (variant1.conversions + variant2.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    return (p1 - p2) / se;
  }

  calculatePValue(zScore) {
    const t = Math.abs(zScore);
    const b1 = 0.254829592;
    const b2 = -0.284496736;
    const b3 = 1.421413741;
    const b4 = -1.453152027;
    const b5 = 1.061405429;
    const p = 0.3275911;

    const sign = zScore < 0 ? -1 : 1;
    const a1 = 1 / (1 + p * t);
    const a2 = a1 * a1;
    const a3 = a2 * a1;
    const a4 = a3 * a1;
    const a5 = a4 * a1;

    const erf = 1 - (b1 * a1 + b2 * a2 + b3 * a3 + b4 * a4 + b5 * a5) * Math.exp(-t * t);
    const pValue = 0.5 * (1 + sign * erf);

    return pValue;
  }

  getVariantAssignment(testId, userId) {
    const hash = this.hashCode(userId + testId);
    return (Math.abs(hash) % 100) < 50 ? 'variant-a' : 'variant-b';
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

module.exports = new ABTestingService();
