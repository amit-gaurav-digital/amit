'use client';

export default function BarChart({ data = [], title = 'Chart', xAxisLabel = '', yAxisLabel = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const chartHeight = 200;

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
      <div className="flex items-end justify-around gap-2 h-64 bg-gray-50 p-6 rounded-lg border border-gray-200">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
              style={{ height: `${(item.value / maxValue) * chartHeight}px` }}
              title={`${item.label}: ${item.value}`}
            />
            <p className="text-xs text-gray-600 mt-2 truncate w-full text-center">{item.label}</p>
          </div>
        ))}
      </div>
      {yAxisLabel && <p className="text-xs text-gray-500 mt-2">{yAxisLabel}</p>}
    </div>
  );
}
