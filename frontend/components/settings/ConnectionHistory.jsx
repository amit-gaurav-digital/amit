'use client';

import { useState } from 'react';

export default function ConnectionHistory({
  history = [],
  title = 'Sync History',
  maxItems = 10
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const displayedHistory = history.slice(0, maxItems);

  const getStatusColor = (item) => {
    if (item.error) return 'border-red-200 bg-red-50';
    return 'border-green-200 bg-green-50';
  };

  const getStatusIcon = (item) => {
    if (item.error) return '✕';
    return '✓';
  };

  const formatDuration = (durationMs) => {
    if (!durationMs) return 'Unknown';
    if (durationMs < 1000) return `${durationMs}ms`;
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

      {displayedHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No sync history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedHistory.map((item, idx) => (
            <div key={idx}>
              {/* Timeline Item Header */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className={`w-full border rounded-lg p-4 text-left transition-colors hover:bg-gray-50 ${getStatusColor(item)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`text-lg mt-0.5 ${item.error ? 'text-red-600' : 'text-green-600'}`}>
                      {getStatusIcon(item)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.error ? 'Sync Failed' : 'Sync Completed'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 ml-4">
                    {expandedIndex === idx ? '▼' : '▶'}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedIndex === idx && (
                <div className="border-l-2 border-gray-200 ml-4 mt-2 pl-4 space-y-2 text-sm">
                  {item.error && (
                    <div>
                      <p className="font-medium text-red-700">Error:</p>
                      <p className="text-gray-700 bg-red-50 rounded px-3 py-2 mt-1">
                        {item.error}
                      </p>
                    </div>
                  )}

                  {item.recordsSynced !== undefined && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Records Synced:</span>
                      <span className="text-gray-900">{item.recordsSynced}</span>
                    </div>
                  )}

                  {item.duration && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Duration:</span>
                      <span className="text-gray-900">{formatDuration(item.duration)}</span>
                    </div>
                  )}

                  {item.details && (
                    <div>
                      <p className="font-medium text-gray-600 mb-1">Details:</p>
                      <p className="text-gray-700">{item.details}</p>
                    </div>
                  )}

                  {item.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Resolved:</span>
                      <span className="text-green-600">
                        {new Date(item.resolvedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {history.length > maxItems && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing {maxItems} of {history.length} sync attempts
          </p>
        </div>
      )}
    </div>
  );
}
