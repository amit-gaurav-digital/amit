'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BarChart3, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import abTestingAPI from '@/lib/abtesting-api';
import BarChart from '@/components/BarChart';

export default function TestResultsPage() {
  const params = useParams();
  const testId = params.testId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('conversionRate');

  useEffect(() => {
    loadTestResults();
  }, [testId]);

  const loadTestResults = async () => {
    setLoading(true);
    try {
      const data = await abTestingAPI.getTestResults(testId);
      setTestData(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading test results...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (!testData) {
    return <div className="text-center py-8">Test not found</div>;
  }

  const { test, results } = testData;
  const hasWinner = test.results.winner;

  const metricOptions = [
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'clickThroughRate', label: 'Click-through Rate' },
    { value: 'bounceRate', label: 'Bounce Rate' },
    { value: 'avgSessionDuration', label: 'Avg Session Duration' }
  ];

  const metricData = {};
  results.forEach(result => {
    metricData[result.variantName] = result.calculations[selectedMetric] || 0;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
        <p className="text-gray-600 mt-2">{test.description}</p>
        <div className="flex gap-4 mt-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            test.status === 'completed' ? 'bg-green-100 text-green-800' :
            test.status === 'running' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {test.status}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
            {test.testType}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Test Duration</h3>
          <p className="text-2xl font-bold text-gray-900">{test.configuration.duration} days</p>
          {test.results.startedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Started: {new Date(test.results.startedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Confidence Level</h3>
          <p className="text-2xl font-bold text-gray-900">{(test.configuration.confidenceLevel * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500 mt-2">Statistical significance threshold</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Variants</h3>
          <p className="text-2xl font-bold text-gray-900">{test.variants.length}</p>
          <p className="text-xs text-gray-500 mt-2">Test variations being compared</p>
        </div>
      </div>

      {/* Winner Announcement */}
      {hasWinner && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Winner Selected</h3>
              <p className="text-green-800 mb-2">
                <strong>{test.results.winner.variantName}</strong> is the winner with{' '}
                <strong>{test.results.winner.improvement.toFixed(2)}%</strong> improvement
              </p>
              <p className="text-sm text-green-700">
                Confidence: {(test.results.winner.significanceLevel * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {test.results.status === 'running' && !hasWinner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Running</h3>
              <p className="text-blue-800">
                Collecting data to determine statistical significance. Check back soon for results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Selection */}
      <div className="mb-8">
        <label className="block text-gray-700 font-medium mb-4">Select Metric</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {metricOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetric === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <BarChart
          title="Metrics Comparison"
          data={metricData}
          colors={{
            [results[0]?.variantName]: '#3b82f6',
            [results[1]?.variantName]: '#ef4444'
          }}
        />

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Variant Details</h3>
          <div className="space-y-6">
            {results.map((result, idx) => (
              <div key={idx} className="border-b pb-6 last:border-b-0 last:pb-0">
                <h4 className="font-semibold text-gray-900 mb-3">{result.variantName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Views</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.metrics.views.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.metrics.conversions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversion Rate</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {result.calculations.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">CTR</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {result.calculations.clickThroughRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Clicks</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.metrics.clicks.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bounce Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.calculations.bounceRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {results.map((result, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-gray-900 mb-4">{result.variantName}</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Shares</p>
                  <p className="text-xl font-semibold text-gray-900">{result.metrics.shares}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="text-xl font-semibold text-gray-900">{result.metrics.comments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Time on Page</p>
                  <p className="text-xl font-semibold text-gray-900">{result.metrics.avgTimeOnPage.toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scroll Depth</p>
                  <p className="text-xl font-semibold text-gray-900">{result.metrics.scrollDepth.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
