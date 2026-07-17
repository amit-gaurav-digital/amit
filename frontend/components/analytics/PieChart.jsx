'use client';

import { useMemo } from 'react';

export default function PieChart({
  data = {},
  title = 'Pie Chart',
  colors = {},
  height = 300,
  loading = false
}) {
  const entries = Object.entries(data);
  const total = useMemo(() => entries.reduce((sum, [_, v]) => sum + v, 0), [entries]);

  const colorPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const slices = useMemo(() => {
    let currentAngle = 0;
    return entries.map(([label, value], idx) => {
      const percentage = (value / total) * 100;
      const sliceAngle = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      return {
        label,
        value,
        percentage: percentage.toFixed(1),
        color: colors[label] || colorPalette[idx % colorPalette.length],
        startAngle,
        endAngle
      };
    });
  }, [entries, total, colors]);

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

  const radius = Math.min(100, height / 3);
  const cx = 120;
  const cy = height / 2;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>{title}</h3>

      <div style={{ display: 'flex', gap: '30px' }}>
        <svg width="240" height={height} viewBox={`0 0 240 ${height}`}>
          {slices.map((slice, idx) => {
            const startRad = (slice.startAngle * Math.PI) / 180;
            const endRad = (slice.endAngle * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${cx} ${cy}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            return (
              <path
                key={idx}
                d={pathData}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer', opacity: 0.8 }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              />
            );
          })}
        </svg>

        <div style={{ flex: 1 }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: slice.color,
                  borderRadius: '2px'
                }} />
                <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>{slice.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{slice.percentage}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${slice.percentage}%`,
                  backgroundColor: slice.color
                }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Total</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
