'use client';

import { useState } from 'react';

export default function PerformanceRankingTable({ blogs, analyticsData }) {
  const [sortBy, setSortBy] = useState('views');
  const [sortOrder, setSortOrder] = useState('desc');

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        No data available
      </div>
    );
  }

  const metrics = [
    { key: 'totalViews', label: 'Total Views', icon: '👁️' },
    { key: 'totalVisitors', label: 'Visitors', icon: '👥' },
    { key: 'avgEngagementScore', label: 'Engagement %', icon: '💬' },
    { key: 'avgBounceRate', label: 'Bounce Rate %', icon: '🚫', reverse: true }
  ];

  const getRankingData = () => {
    const data = analyticsData.map((analytics, idx) => ({
      blog: blogs[idx],
      totalViews: analytics.totalViews || 0,
      totalVisitors: analytics.totalVisitors || 0,
      avgEngagementScore: analytics.avgEngagementScore || 0,
      avgBounceRate: analytics.avgBounceRate || 0
    }));

    const sorted = [...data].sort((a, b) => {
      const metricKey = sortBy;
      const aVal = a[metricKey] || 0;
      const bVal = b[metricKey] || 0;

      const metric = metrics.find(m => m.key === metricKey);
      const isReverse = metric?.reverse;

      if (sortOrder === 'asc') {
        return isReverse ? bVal - aVal : aVal - bVal;
      } else {
        return isReverse ? aVal - bVal : bVal - aVal;
      }
    });

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  };

  const rankingData = getRankingData();

  const getTrendColor = (rank) => {
    if (rank === 1) return '#10b981';
    if (rank === 2) return '#3b82f6';
    if (rank === 3) return '#f59e0b';
    return '#6b7280';
  };

  const getRankBadge = (rank) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[rank - 1] || `#${rank}`;
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const SortArrow = ({ column }) => {
    if (sortBy !== column) return <span style={{ color: '#d1d5db' }}>⬍</span>;
    return <span style={{ color: '#3b82f6' }}>
      {sortOrder === 'asc' ? '↑' : '↓'}
    </span>;
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        🏆 Performance Rankings
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '800px'
        }}>
          <thead>
            <tr style={{
              borderBottom: '2px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontWeight: 'bold',
                color: '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleSort('rank')}
              >
                Rank <SortArrow column="rank" />
              </th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontWeight: 'bold',
                color: '#374151',
                fontSize: '13px'
              }}>
                Blog
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric.key}
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort(metric.key)}
                >
                  {metric.icon} {metric.label} <SortArrow column={metric.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankingData.map((item, idx) => (
              <tr
                key={item.blog._id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#f9fafb'}
              >
                <td style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: getTrendColor(item.rank)
                }}>
                  <span style={{ fontSize: '18px', marginRight: '4px' }}>
                    {getRankBadge(item.rank)}
                  </span>
                  {item.rank > 3 && item.rank}
                </td>
                <td style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1f2937'
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: '#1f2937' }}>
                      {item.blog.title}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '250px'
                    }}>
                      {item.blog.url}
                    </p>
                  </div>
                </td>
                {metrics.map((metric) => (
                  <td
                    key={metric.key}
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}
                  >
                    {metric.key.includes('Score') || metric.key.includes('Rate')
                      ? `${item[metric.key].toFixed(1)}%`
                      : item[metric.key].toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Summary */}
      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#1f2937',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          📈 Summary
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {metrics.map((metric) => {
            const values = rankingData.map(d => d[metric.key]);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const best = Math.max(...values);
            const bestBlog = rankingData.find(d => d[metric.key] === best);

            return (
              <div
                key={metric.key}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '12px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 8px 0',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {metric.icon} {metric.label}
                </p>
                <p style={{
                  margin: '0 0 4px 0',
                  color: '#1f2937',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  Avg: {metric.key.includes('Score') || metric.key.includes('Rate')
                    ? avg.toFixed(1) + '%'
                    : avg.toLocaleString()}
                </p>
                <p style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  Best: {bestBlog.blog.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
