'use client';

import { useEffect, useState } from 'react';

export default function MetricsComparisonChart({ blogs, analyticsData }) {
  const [chartType, setChartType] = useState('bar');

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
        No data available to compare
      </div>
    );
  }

  const metrics = [
    { key: 'totalViews', label: 'Total Views', color: '#3b82f6' },
    { key: 'totalVisitors', label: 'Visitors', color: '#8b5cf6' },
    { key: 'avgEngagementScore', label: 'Engagement %', color: '#10b981' },
    { key: 'avgBounceRate', label: 'Bounce Rate %', color: '#f59e0b' }
  ];

  const getMaxValue = (metricKey) => {
    return Math.max(
      ...analyticsData.map(data => data[metricKey] || 0),
      1
    );
  };

  const renderBarChart = () => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '20px',
        height: '300px',
        padding: '20px 0'
      }}>
        {metrics.map((metric) => {
          const maxValue = getMaxValue(metric.key);

          return (
            <div key={metric.key} style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 12px 0',
                color: '#6b7280',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                {metric.label}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '6px',
                height: '220px'
              }}>
                {analyticsData.map((data, idx) => {
                  const value = data[metric.key] || 0;
                  const height = (value / maxValue) * 100;
                  const blog = blogs[idx];

                  return (
                    <div
                      key={blog._id}
                      style={{
                        flex: 1,
                        backgroundColor: metric.color,
                        borderRadius: '4px 4px 0 0',
                        height: `${height}%`,
                        minHeight: '4px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                        position: 'relative',
                        group: true
                      }}
                      title={`${blog.title}: ${value.toLocaleString()}`}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                    >
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '6px',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.pointerEvents = 'auto';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '0';
                        e.target.style.pointerEvents = 'none';
                      }}
                      >
                        {value.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                display: 'flex',
                gap: '6px',
                marginTop: '8px',
                fontSize: '10px'
              }}>
                {analyticsData.map((data, idx) => (
                  <div
                    key={blogs[idx]._id}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={blogs[idx].title}
                  >
                    {blogs[idx].title.substring(0, 8)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrendChart = () => {
    if (!analyticsData[0]?.dailyTrend) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No trend data available
        </div>
      );
    }

    const maxDays = Math.max(...analyticsData.map(d => d.dailyTrend?.length || 0));
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        height: '250px',
        padding: '20px 0'
      }}>
        {Array.from({ length: maxDays }).map((_, dayIdx) => {
          const maxViewsForDay = Math.max(
            ...analyticsData.map(d => d.dailyTrend?.[dayIdx]?.views || 0),
            1
          );

          return (
            <div
              key={dayIdx}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '1px',
                position: 'relative',
                group: true
              }}
            >
              {analyticsData.map((data, blogIdx) => {
                const views = data.dailyTrend?.[dayIdx]?.views || 0;
                const height = (views / maxViewsForDay) * 100;

                return (
                  <div
                    key={blogs[blogIdx]._id}
                    style={{
                      flex: 1,
                      backgroundColor: colors[blogIdx % colors.length],
                      borderRadius: '3px 3px 0 0',
                      height: `${Math.max(height, 2)}%`,
                      opacity: 0.8,
                      transition: 'opacity 0.2s',
                      cursor: 'pointer'
                    }}
                    title={`${blogs[blogIdx].title}: ${views} views on Day ${dayIdx + 1}`}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          📊 Metrics Comparison
        </h3>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setChartType('bar')}
            style={{
              padding: '8px 16px',
              backgroundColor: chartType === 'bar' ? '#3b82f6' : '#f3f4f6',
              color: chartType === 'bar' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            📊 Bars
          </button>
          <button
            onClick={() => setChartType('trend')}
            style={{
              padding: '8px 16px',
              backgroundColor: chartType === 'trend' ? '#3b82f6' : '#f3f4f6',
              color: chartType === 'trend' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            📈 Trends
          </button>
        </div>
      </div>

      {chartType === 'bar' ? renderBarChart() : renderTrendChart()}

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
        {blogs.map((blog, idx) => (
          <div
            key={blog._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][idx % 5]
            }}></span>
            <span style={{ color: '#374151', fontWeight: '500' }}>
              {blog.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
