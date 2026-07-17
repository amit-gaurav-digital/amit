'use client';

export default function LineChart({ data = [], title = 'Chart', xAxisLabel = '', yAxisLabel = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const minValue = Math.min(...data.map(d => d.value || 0));
  const range = maxValue - minValue || 1;
  const chartHeight = 200;
  const chartWidth = data.length > 1 ? 100 / (data.length - 1) : 100;

  const points = data.map((item, idx) => {
    const normalizedValue = (item.value - minValue) / range;
    const x = (idx / (data.length - 1 || 1)) * 100;
    const y = 100 - normalizedValue * 100;
    return { x, y, ...item };
  });

  const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <svg viewBox="0 0 100 100" className="w-full h-64" preserveAspectRatio="none">
          <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="0.5" />
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="0.8" fill="#2563eb" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
