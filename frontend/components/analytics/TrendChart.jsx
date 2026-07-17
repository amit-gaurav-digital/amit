'use client';

import { useMemo } from 'react';

export default function TrendChart({
  data = [],
  dataKey = 'value',
  title = 'Trend',
  color = '#3b82f6',
  comparison = null,
  showForecast = false,
  height = 300,
  loading = false
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((point, idx) => ({
      ...point,
      index: idx,
      value: point[dataKey] || 0,
      compareValue: comparison?.[idx]?.[dataKey]
    }));
  }, [data, dataKey, comparison]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map(d => Math.max(d.value, d.compareValue || 0)));
  }, [chartData]);

  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map(d => Math.min(d.value, d.compareValue || 0)));
  }, [chartData]);

  const range = maxValue - minValue || 1;

  const calculateTrend = () => {
    if (chartData.length < 2) return 'stable';
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'stable';
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    if (trend === 'up') return '📈 Trending up';
    if (trend === 'down') return '📉 Trending down';
    return '➡️ Stable';
  };

  const getChangePercent = () => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return first !== 0 ? ((last - first) / first * 100) : 0;
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px',
        height: height + 60
      }}>
        <div style={{ height: '100%', backgroundColor: '#f3f4f6', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {getTrendIcon()} • Change: {getChangePercent().toFixed(1)}%
            </p>
          </div>
          {chartData.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color }}>
                {chartData[chartData.length - 1].value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                Latest value
              </p>
            </div>
          )}
        </div>
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartData.length * 40} ${height}`}
        style={{ overflow: 'visible' }}
      >
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => {
          const y = (height / 5) * (i + 1);
          return (
            <line
              key={`grid-${i}`}
              x1="0"
              y1={y}
              x2={chartData.length * 40}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4"
              opacity="0.5"
            />
          );
        })}

        {/* Main line */}
        {chartData.length > 1 && (
          <polyline
            points={chartData
              .map((d, idx) => {
                const x = (idx + 1) * 40;
                const normalized = (d.value - minValue) / range;
                const y = height - normalized * (height * 0.8);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Fill under line */}
        {chartData.length > 1 && (
          <path
            d={`M ${chartData.map((d, idx) => {
              const x = (idx + 1) * 40;
              const normalized = (d.value - minValue) / range;
              const y = height - normalized * (height * 0.8);
              return `${x},${y}`;
            }).join(' ')} L ${(chartData.length) * 40},${height} L 40,${height} Z`}
            fill={color}
            opacity="0.1"
          />
        )}

        {/* Comparison line */}
        {comparison && chartData.some(d => d.compareValue !== undefined) && (
          <polyline
            points={chartData
              .map((d, idx) => {
                if (!d.compareValue) return null;
                const x = (idx + 1) * 40;
                const normalized = (d.compareValue - minValue) / range;
                const y = height - normalized * (height * 0.8);
                return `${x},${y}`;
              })
              .filter(Boolean)
              .join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5"
            vectorEffect="non-scaling-stroke"
            opacity="0.6"
          />
        )}

        {/* Data points */}
        {chartData.map((d, idx) => {
          const x = (idx + 1) * 40;
          const normalized = (d.value - minValue) / range;
          const y = height - normalized * (height * 0.8);

          return (
            <circle
              key={`point-${idx}`}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              opacity="0.8"
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280' }}>
              Average Value
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color }}>
              {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280' }}>
              Peak Value
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color }}>
              {Math.max(...chartData.map(d => d.value)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      {comparison && (
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: color }} />
            <span>Current</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#10b981', opacity: '0.6' }} />
            <span>Previous</span>
          </div>
        </div>
      )}
    </div>
  );
}
