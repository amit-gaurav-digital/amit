'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, TrendingUp, Users, Eye, Share2 } from 'lucide-react';
import MetricsCard from '@/components/MetricsCard';
import LineChart from '@/components/LineChart';
import BarChart from '@/components/BarChart';
import analyticsAPI from '@/lib/analytics-api';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [topBlogs, setTopBlogs] = useState([]);
  const [days, setDays] = useState(30);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboardData();
    loadTopBlogs();
  }, [days]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await analyticsAPI.getDashboardSummary(days);
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadTopBlogs = async () => {
    try {
      const blogs = await analyticsAPI.getTopPerformingBlogs(10, days);
      setTopBlogs(blogs);
    } catch (err) {
      console.error('Failed to load top blogs:', err);
    }
  };

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    const start = new Date(Date.now() - newDays * 24 * 60 * 60 * 1000);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your blog performance across all metrics</p>
        </div>

        <div className="flex gap-2">
          {[7, 30, 90, 365].map(d => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {d}d
            </button>
          ))}

          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : dashboardData ? (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Total Page Views"
              value={dashboardData.summary.totalViews}
              icon={Eye}
              color="blue"
            />
            <MetricsCard
              title="Unique Visitors"
              value={dashboardData.summary.totalVisitors}
              icon={Users}
              color="green"
            />
            <MetricsCard
              title="Social Shares"
              value={dashboardData.summary.totalShares}
              icon={Share2}
              color="purple"
            />
            <MetricsCard
              title="Total Comments"
              value={dashboardData.summary.totalComments}
              icon={TrendingUp}
              color="orange"
            />
          </div>

          {/* Traffic and Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BarChart
              title="Traffic Sources"
              data={dashboardData.trafficSources}
              colors={{
                organic: '#10b981',
                direct: '#3b82f6',
                referral: '#8b5cf6',
                social: '#ec4899',
                email: '#f59e0b',
                paid: '#ef4444'
              }}
            />
            <BarChart
              title="Device Breakdown"
              data={dashboardData.devices}
              colors={{
                desktop: '#3b82f6',
                mobile: '#10b981',
                tablet: '#f59e0b'
              }}
            />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Bounce Rate</h3>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.summary.avgBounceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">Average across all pages</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Avg Time on Page</h3>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(dashboardData.summary.avgTimeOnPage)}s
              </p>
              <p className="text-xs text-gray-500 mt-2">Average session duration</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Published Blogs</h3>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.totalPublishedBlogs}
              </p>
              <p className="text-xs text-gray-500 mt-2">Total published articles</p>
            </div>
          </div>

          {/* Top Performing Blogs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Blogs</h3>

            {topBlogs.length === 0 ? (
              <p className="text-gray-500">No blogs yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-900">Blog Title</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Views</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Visitors</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Engagement</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Shares</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Engagement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBlogs.map((blog, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {blog.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {blog.totalViews.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {blog.totalVisitors.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {Math.round(blog.avgEngagement)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {blog.totalShares.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {blog.engagementRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
