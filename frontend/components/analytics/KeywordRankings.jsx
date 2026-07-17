'use client';

import { useEffect, useState } from 'react';

export default function KeywordRankings({ blogId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('position');

  useEffect(() => {
    fetchKeywordData();
  }, [blogId]);

  const fetchKeywordData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/keywords/${blogId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else if (response.status !== 404) {
        setError('Failed to fetch keyword data');
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
        <h3 className="text-lg font-bold text-yellow-900 mb-2">🔑 Keyword Rankings</h3>
        <p className="text-yellow-800 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || !data.keywords || data.keywords.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No keyword data available yet</p>
      </div>
    );
  }

  const filteredKeywords = data.keywords.filter(k =>
    k.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
    switch (sortBy) {
      case 'position':
        return (a.position || 999) - (b.position || 999);
      case 'clicks':
        return (b.clicks || 0) - (a.clicks || 0);
      case 'impressions':
        return (b.impressions || 0) - (a.impressions || 0);
      case 'ctr':
        return (b.ctr || 0) - (a.ctr || 0);
      default:
        return 0;
    }
  });

  const getTrendIcon = (trend) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getRankingColor = (position) => {
    if (!position) return 'text-gray-500';
    if (position <= 3) return 'text-green-600 font-bold';
    if (position <= 10) return 'text-blue-600 font-bold';
    if (position <= 30) return 'text-yellow-600 font-bold';
    return 'text-orange-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 Keyword Rankings</h3>

        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="position">Sort by Position</option>
            <option value="clicks">Sort by Clicks</option>
            <option value="impressions">Sort by Impressions</option>
            <option value="ctr">Sort by CTR</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">
          Showing {sortedKeywords.length} of {data.keywords.length} keywords
        </p>
      </div>

      {/* Keywords Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-bold text-gray-900">Keyword</th>
              <th className="px-4 py-3 text-center font-bold text-gray-900">Position</th>
              <th className="px-4 py-3 text-right font-bold text-gray-900">Clicks</th>
              <th className="px-4 py-3 text-right font-bold text-gray-900">Impressions</th>
              <th className="px-4 py-3 text-right font-bold text-gray-900">CTR</th>
              <th className="px-4 py-3 text-center font-bold text-gray-900">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sortedKeywords.slice(0, 20).map((keyword, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <span className="truncate block max-w-xs" title={keyword.query}>
                    {keyword.query}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold text-lg ${getRankingColor(keyword.position)}`}>
                    {keyword.position || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-gray-900">{keyword.clicks || 0}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-600">{keyword.impressions || 0}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-600">{(keyword.ctr || 0).toFixed(2)}%</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-lg ${getTrendColor(keyword.positionTrend)}`}>
                    {getTrendIcon(keyword.positionTrend)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      {sortedKeywords.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600">Top 3 Keywords</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              {sortedKeywords.filter(k => k.position && k.position <= 3).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Top 10 Keywords</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {sortedKeywords.filter(k => k.position && k.position <= 10).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Top 30 Keywords</p>
            <p className="text-lg font-bold text-yellow-600 mt-1">
              {sortedKeywords.filter(k => k.position && k.position <= 30).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Position</p>
            <p className="text-lg font-bold text-orange-600 mt-1">
              {(sortedKeywords
                .filter(k => k.position)
                .reduce((sum, k) => sum + k.position, 0) / sortedKeywords.filter(k => k.position).length || 0
              ).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
