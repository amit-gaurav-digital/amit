'use client';

export default function BarChart({
  data = {},
  title = 'Bar Chart',
  colors = {},
  height = 300,
  loading = false
}) {
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

  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([_, v]) => v || 0));
  const barHeight = height * 0.8;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>{title}</h3>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: barHeight }}>
        {entries.map(([label, value]) => {
          const barHeight = (value / maxValue) * height * 0.7;
          const bgColor = colors[label] || '#3b82f6';

          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  backgroundColor: bgColor,
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.8';
                  e.target.style.boxShadow = 'none';
                }}
                title={`${label}: ${value}`}
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280', textAlign: 'center', wordBreak: 'break-word' }}>
                {label}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                {value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
