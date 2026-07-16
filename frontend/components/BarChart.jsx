'use client';

export default function BarChart({ data, title, height = 300, colors = {} }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...Object.values(data));
  const entries = Object.entries(data);

  const defaultColors = {
    organic: '#10b981',
    direct: '#3b82f6',
    referral: '#8b5cf6',
    social: '#ec4899',
    email: '#f59e0b',
    paid: '#ef4444',
    desktop: '#3b82f6',
    mobile: '#10b981',
    tablet: '#f59e0b'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="font-semibold text-gray-900 mb-6">{title}</h3>}

      <div className="space-y-4">
        {entries.map(([label, value], idx) => {
          const percentage = (value / maxValue) * 100;
          const color = colors[label] || defaultColors[label] || '#3b82f6';

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {label}
                </label>
                <span className="text-sm font-semibold text-gray-900">
                  {value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">
              {Object.values(data).reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Top Source</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {Object.entries(data).sort(([, a], [, b]) => b - a)[0][0]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
