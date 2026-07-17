'use client';

import { useMemo } from 'react';

export default function MetricsGrid({
  metrics = {},
  columns = 4,
  loading = false,
  compareMode = false,
  comparison = {}
}) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(150, 100 / columns * 100)}px, 1fr))`,
    gap: '20px',
    marginBottom: '20px'
  };

  const metricEntries = Object.entries(metrics);

  if (loading) {
    return (
      <div style={gridStyle}>
        {[...Array(columns)].map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '20px',
              height: '120px',
              animation: 'pulse 2s infinite'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {metricEntries.map(([key, metric]) => (
        <MetricCard
          key={key}
          metricKey={key}
          metric={metric}
          compareMode={compareMode}
          comparison={comparison[key]}
        />
      ))}
    </div>
  );
}

function MetricCard({ metricKey, metric, compareMode, comparison }) {
  const isPositiveChange = useMemo(() => {
    if (!comparison || comparison.change === undefined) return null;
    return comparison.change >= 0;
  }, [comparison]);

  const getColor = () => {
    if (metricKey.includes('bounce') || metricKey.includes('decline')) {
      return isPositiveChange === false ? '#10b981' : '#ef4444';
    }
    return isPositiveChange === true ? '#10b981' : '#ef4444';
  };

  const formatValue = (value) => {
    if (typeof value !== 'number') return value;
    if (value > 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value > 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toFixed(1);
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px',
        borderTop: `3px solid ${metric.color || '#3b82f6'}`
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <p style={{
          margin: '0 0 5px 0',
          color: '#6b7280',
          fontSize: '12px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {metric.label || metricKey}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: metric.color || '#1f2937'
          }}>
            {formatValue(metric.value)}{metric.suffix || ''}
          </p>
        </div>
        {metric.icon && (
          <div style={{ fontSize: '20px', opacity: 0.6 }}>
            {metric.icon}
          </div>
        )}
      </div>

      {compareMode && comparison && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: getColor(),
            fontWeight: '500'
          }}>
            {isPositiveChange ? '📈' : '📉'} {Math.abs(comparison.change || 0).toFixed(1)}% vs previous
          </p>
        </div>
      )}

      {metric.description && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '11px',
          color: '#9ca3af'
        }}>
          {metric.description}
        </p>
      )}
    </div>
  );
}
