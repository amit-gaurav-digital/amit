'use client';

import { useMemo } from 'react';

export default function LineChart({ data, dataKey, title, height = 300, color = '#3b82f6' }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
    const minValue = 0;
    const range = maxValue - minValue || 1;

    return {
      maxValue,
      minValue,
      range,
      points: data.map((d, i) => ({
        x: (i / Math.max(data.length - 1, 1)) * 100,
        y: ((d[dataKey] || 0) - minValue) / range * 100,
        value: d[dataKey] || 0,
        label: d.date || i
      }))
    };
  }, [data, dataKey]);

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const padding = 40;
  const width = 100;
  const viewHeight = height / 40;

  const pathData = chartData.points
    .map((point, i) => {
      const x = (padding + (point.x / 100) * (width - padding * 2)) + '%';
      const y = ((100 - point.y) * viewHeight) + 'px';
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>}

      <svg width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={`grid-${y}`}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="#e5e7eb"
            strokeDasharray="4"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map(y => {
          const value = chartData.maxValue - (chartData.maxValue * y / 100);
          return (
            <text
              key={`label-${y}`}
              x="-5"
              y={`${y}%`}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
              dy="0.3em"
            >
              {Math.round(value)}
            </text>
          );
        })}

        {/* Line and area */}
        <path
          d={`${pathData} L ${width - padding}px ${height - padding}px L ${padding}px ${height - padding}px Z`}
          fill={`url(#gradient-${dataKey})`}
        />
        <path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {chartData.points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={`${(padding + (point.x / 100) * (width - padding * 2))}%`}
            cy={`${100 - point.y}%`}
            r="3"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-600 mt-4 px-4">
        {chartData.points.length > 0 && (
          <>
            <span>{chartData.points[0].label}</span>
            <span>{chartData.points[Math.floor(chartData.points.length / 2)].label}</span>
            <span>{chartData.points[chartData.points.length - 1].label}</span>
          </>
        )}
      </div>
    </div>
  );
}
