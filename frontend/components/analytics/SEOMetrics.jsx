'use client';

import { useEffect, useState } from 'react';

export default function SEOMetrics({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSEOData();
  }, [blogId]);

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/seo-metrics/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status !== 404) {
        setError('Failed to fetch SEO data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">📊 SEO Metrics</h3>
        <p className="text-yellow-800 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getTrendIcon = (trend) => {
    if (!trend) return '→';
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500';
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">📈 SEO Metrics (30 Days)</h3>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-gray-600 font-medium mb-2">Click Trend</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{data.clickTrend || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">vs previous</p>
            </div>
            <span className={`text-2xl ${getTrendColor(data.clickTrend)}`}>
              {getTrendIcon(data.clickTrend)}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 font-medium mb-2">Impression Trend</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">{data.impressionTrend || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">vs previous</p>
            </div>
            <span className={`text-2xl ${getTrendColor(data.impressionTrend)}`}>
              {getTrendIcon(data.impressionTrend)}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-gray-600 font-medium mb-2">Avg CTR</p>
          <p className="text-2xl font-bold text-green-600 mt-4">
            {(data.averageCTR || 0).toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">Industry avg: ~2%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-xs text-gray-600 font-medium mb-2">Avg Position</p>
          <p className="text-2xl font-bold text-orange-600 mt-4">
            {(data.averagePosition || 0).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Lower is better</p>
        </div>
      </div>

      {/* Mobile & Core Web Vitals */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 mb-4">📱 Mobile Friendly</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mobile Usability</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                data.mobileUsability?.errors === 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {data.mobileUsability?.errors || 0} issues
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Warnings</span>
              <span className="text-sm font-medium text-gray-900">
                {data.mobileUsability?.warnings || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 mb-4">⚡ Core Web Vitals</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                data.coreWebVitals?.status === 'good'
                  ? 'bg-green-100 text-green-800'
                  : data.coreWebVitals?.status === 'poor'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {data.coreWebVitals?.status || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Monitor page experience metrics in Search Console
            </p>
          </div>
        </div>
      </div>

      {/* Position History */}
      {data.positionHistory && data.positionHistory.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 mb-4">📊 Position Trend (Last 7 Days)</h4>
          <div className="flex items-end gap-2 h-24">
            {data.positionHistory.map((point, idx) => (
              <div
                key={idx}
                className="flex-1 bg-blue-200 rounded-t relative group"
                style={{ height: `${(point.position / Math.max(...data.positionHistory.map(p => p.position || 1))) * 100}%` }}
                title={`Day ${idx + 1}: Position ${point.position}`}
              >
                <div className="invisible group-hover:visible absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {point.position}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
