'use client';

import { useEffect, useState } from 'react';

export default function TrafficSources({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrafficData();
  }, [blogId]);

  const fetchTrafficData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/traffic-sources/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status !== 404) {
        setError('Failed to fetch traffic data');
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">🚗 Traffic Sources</h3>
        <p className="text-yellow-800 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || !data.channels) {
    return null;
  }

  const channels = [
    { name: 'organic', label: 'Organic Search', icon: '🔍', color: 'from-green-500 to-green-600' },
    { name: 'direct', label: 'Direct', icon: '→', color: 'from-blue-500 to-blue-600' },
    { name: 'referral', label: 'Referral', icon: '🔗', color: 'from-purple-500 to-purple-600' },
    { name: 'social', label: 'Social', icon: '👍', color: 'from-pink-500 to-pink-600' },
    { name: 'email', label: 'Email', icon: '📧', color: 'from-orange-500 to-orange-600' },
    { name: 'paid', label: 'Paid Search', icon: '💰', color: 'from-yellow-500 to-yellow-600' }
  ];

  const totalUsers = Object.values(data.channels).reduce((sum, ch) => sum + (ch.users || 0), 0) || 1;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">🚗 Traffic Sources</h3>

      {/* Pie Chart-like Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Donut Chart */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                return channels.map((channel) => {
                  const value = data.channels[channel.name];
                  if (!value || !value.users) return null;

                  const percent = (value.users / totalUsers) * 100;
                  const startAngle = (cumulativePercent / 100) * 360;
                  const endAngle = ((cumulativePercent + percent) / 100) * 360;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  const x1 = 50 + 40 * Math.cos(startRad);
                  const y1 = 50 + 40 * Math.sin(startRad);
                  const x2 = 50 + 40 * Math.cos(endRad);
                  const y2 = 50 + 40 * Math.sin(endRad);

                  const largeArc = percent > 50 ? 1 : 0;
                  const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  const colors = {
                    'organic': '#10b981',
                    'direct': '#3b82f6',
                    'referral': '#8b5cf6',
                    'social': '#ec4899',
                    'email': '#f97316',
                    'paid': '#eab308'
                  };

                  cumulativePercent += percent;
                  return (
                    <path key={channel.name} d={pathData} fill={colors[channel.name]} />
                  );
                });
              })()}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Details */}
        <div className="lg:col-span-2 space-y-3">
          {channels.map((channel) => {
            const value = data.channels[channel.name];
            if (!value || !value.users) return null;

            const percent = ((value.users / totalUsers) * 100).toFixed(1);

            return (
              <div key={channel.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {channel.label}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${channel.color}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {value.users || 0} users
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-bold text-gray-900 mb-4">Detailed Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-bold text-gray-900">Source</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900">Users</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900">Sessions</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => {
                const value = data.channels[channel.name];
                if (!value || !value.users) return null;

                return (
                  <tr key={channel.name} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="mr-2">{channel.icon}</span>
                      {channel.label}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {(value.users || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(value.sessions || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(value.bounceRate || 0).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
