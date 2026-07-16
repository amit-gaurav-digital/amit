'use client';

import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

export default function MetricsCard({
  title,
  value,
  unit = '',
  change = null,
  icon: Icon = TrendingUp,
  color = 'blue',
  loading = false
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  const iconClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  const isPositive = change >= 0;

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold">
              {loading ? '...' : value.toLocaleString()}
            </p>
            {unit && <span className="text-lg opacity-75">{unit}</span>}
          </div>

          {change !== null && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(change)}% from last period
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${iconClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
