'use client';

import { useState } from 'react';

export default function TrendComparisonChart({ blogs, analyticsData }) {
  const [selectedMetric, setSelectedMetric] = useState('views');

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
        No data available to compare trends
      </div>
    );
  }

  const metrics = [
    { key: 'views', label: 'Page Views' },
    { key: 'users', label: 'Unique Users' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'bounceRate', label: 'Bounce Rate' }
  ];

  const getMaxDays = () => {
    return Math.max(...analyticsData.map(d => d.dailyTrend?.length || 0));
  };

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  const renderLineChart = () => {
    const maxDays = getMaxDays();

    if (maxDays === 0) {
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

    const width = 800;
    const height = 300;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getMaxValue = () => {
      let max = 0;
      analyticsData.forEach(data => {
        if (data.dailyTrend) {
          data.dailyTrend.forEach(day => {
            const value = day[selectedMetric] || 0;
            if (value > max) max = value;
          });
        }
      });
      return Math.max(max, 1);
    };

    const maxValue = getMaxValue();

    const generatePath = (dataPoints) => {
      if (dataPoints.length === 0) return '';

      const points = dataPoints
        .map((value, idx) => {
          const x = (idx / (maxDays - 1 || 1)) * chartWidth + padding;
          const y = height - ((value / maxValue) * chartHeight + padding);
          return `${x},${y}`;
        })
        .join(' L ');

      return `M ${points}`;
    };

    return (
      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            width: '100%',
            minWidth: '600px',
            height: 'auto'
          }}
        >
          {/* Grid Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`h-grid-${i}`}
              x1={padding}
              y1={padding + (chartHeight / 4) * i}
              x2={width - padding}
              y2={padding + (chartHeight / 4) * i}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4"
            />
          ))}

          {/* Y-Axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* X-Axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* Y-Axis Labels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const value = Math.round((maxValue / 4) * i);
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={height - padding - (chartHeight / 4) * i + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toLocaleString()}
              </text>
            );
          })}

          {/* Lines for each blog */}
          {analyticsData.map((data, blogIdx) => {
            if (!data.dailyTrend || data.dailyTrend.length === 0) return null;

            const values = data.dailyTrend.map(day => day[selectedMetric] || 0);
            const path = generatePath(values);

            return (
              <g key={blogs[blogIdx]._id}>
                <path
                  d={path}
                  stroke={colors[blogIdx % colors.length]}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* Dots */}
                {values.map((value, dayIdx) => {
                  const x = (dayIdx / (maxDays - 1 || 1)) * chartWidth + padding;
                  const y = height - ((value / maxValue) * chartHeight + padding);

                  return (
                    <circle
                      key={`dot-${blogIdx}-${dayIdx}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[blogIdx % colors.length]}
                      opacity="0.6"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
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
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          📊 Trend Comparison
        </h3>

        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          {metrics.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>

      {renderLineChart()}

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginTop: '24px',
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
              height: '3px',
              borderRadius: '2px',
              backgroundColor: colors[idx % colors.length]
            }}></span>
            <span style={{ color: '#374151', fontWeight: '500' }}>
              {blog.title}
            </span>
          </div>
        ))}
      </div>

      {/* Data Summary */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{
          margin: '0 0 12px 0',
          color: '#6b7280',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Selected Metric: {metrics.find(m => m.key === selectedMetric)?.label}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          {blogs.map((blog, blogIdx) => {
            const data = analyticsData[blogIdx];
            if (!data?.dailyTrend || data.dailyTrend.length === 0) return null;

            const values = data.dailyTrend.map(day => day[selectedMetric] || 0);
            const total = values.reduce((a, b) => a + b, 0);
            const avg = total / values.length;
            const max = Math.max(...values);

            return (
              <div
                key={blog._id}
                style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {blog.title.substring(0, 15)}
                </p>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <p style={{ margin: '2px 0' }}>
                    Total: {total.toLocaleString()}
                  </p>
                  <p style={{ margin: '2px 0' }}>
                    Avg: {avg.toFixed(1)}
                  </p>
                  <p style={{ margin: '2px 0' }}>
                    Peak: {max.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
