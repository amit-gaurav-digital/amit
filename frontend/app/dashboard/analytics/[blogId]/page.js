'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import LineChart from '@/components/LineChart';
import BarChart from '@/components/BarChart';
import analyticsAPI from '@/lib/analytics-api';

export default function BlogAnalyticsPage() {
  const params = useParams();
  const blogId = params.blogId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [referrers, setReferrers] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, growthData, referrersData, geoData] = await Promise.all([
        analyticsAPI.getBlogAnalytics(blogId, dateRange.start, dateRange.end),
        analyticsAPI.getGrowthMetrics(blogId, 30),
        analyticsAPI.getTopReferrers(blogId, dateRange.start, dateRange.end),
        analyticsAPI.getGeographicData(blogId, dateRange.start, dateRange.end)
      ]);

      setAnalytics(analyticsData);
      setGrowth(growthData);
      setReferrers(referrersData);
      setGeoData(geoData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await analyticsAPI.exportAnalytics(blogId, dateRange.start, dateRange.end);
    } catch (err) {
      setError('Failed to export analytics');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-8">No analytics available</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{analytics.blog.title}</h1>
          <p className="text-gray-600 mt-2">Detailed analytics and performance metrics</p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Growth Metrics */}
      {growth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Page Views</h3>
            <div className="flex items-end gap-4">
              <p className="text-3xl font-bold text-gray-900">{growth.views.current}</p>
              <div className={`flex items-center gap-1 ${growth.views.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth.views.growth >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="font-semibold">{Math.abs(growth.views.growth)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Unique Visitors</h3>
            <div className="flex items-end gap-4">
              <p className="text-3xl font-bold text-gray-900">{growth.visitors.current}</p>
              <div className={`flex items-center gap-1 ${growth.visitors.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth.visitors.growth >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="font-semibold">{Math.abs(growth.visitors.growth)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Engagement</h3>
            <div className="flex items-end gap-4">
              <p className="text-3xl font-bold text-gray-900">{growth.engagement.current}</p>
              <div className={`flex items-center gap-1 ${growth.engagement.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth.engagement.growth >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="font-semibold">{Math.abs(growth.engagement.growth)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {analytics.trend && analytics.trend.length > 0 && (
          <LineChart
            title="Page Views Trend"
            data={analytics.trend}
            dataKey="pageViews"
            color="#3b82f6"
            height={300}
          />
        )}

        {analytics.trend && analytics.trend.length > 0 && (
          <LineChart
            title="Unique Visitors Trend"
            data={analytics.trend}
            dataKey="uniqueVisitors"
            color="#10b981"
            height={300}
          />
        )}
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Bounce Rate</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.aggregated.avgBounceRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">Lower is better</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Avg Time on Page</h3>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(analytics.aggregated.avgTimeOnPage)}s
          </p>
          <p className="text-xs text-gray-500 mt-2">Average session duration</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Avg Scroll Depth</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.aggregated.avgScrollDepth.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">How far users scroll</p>
        </div>
      </div>

      {/* Referrers and Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h3>
          {referrers.length === 0 ? (
            <p className="text-gray-500">No referrer data</p>
          ) : (
            <div className="space-y-3">
              {referrers.slice(0, 8).map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{ref.source}</span>
                  <div className="flex gap-4">
                    <span className="text-sm text-gray-600">{ref.views} views</span>
                    <span className="text-sm font-semibold text-blue-600">{ref.conversionRate}% CTR</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          {geoData.length === 0 ? (
            <p className="text-gray-500">No geographic data</p>
          ) : (
            <div className="space-y-3">
              {geoData.slice(0, 8).map((geo, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{geo._id}</span>
                  <div className="flex gap-4">
                    <span className="text-sm text-gray-600">{geo.totalViews} views</span>
                    <span className="text-sm font-semibold text-blue-600">{geo.totalVisitors} visitors</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalViews.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Visitors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalVisitors.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Click Throughs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalClicks.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Social Shares</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalShares.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Comments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalComments.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Likes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.aggregated.totalLikes.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
