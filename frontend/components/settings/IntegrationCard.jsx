'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function IntegrationCard({
  name,
  icon,
  description,
  connected,
  lastSync,
  status,
  onSync,
  onDisconnect,
  href,
  color = 'blue'
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setSyncing] = useState(false);

  const handleSync = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSync) {
      setSyncing(true);
      try {
        await onSync();
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleDisconnect = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onDisconnect && window.confirm('Are you sure you want to disconnect?')) {
      try {
        await onDisconnect();
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  };

  const colorClasses = {
    blue: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    green: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      badge: 'bg-green-100 text-green-800'
    }
  };

  const c = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-lg p-6 border ${c.border} cursor-pointer transition-all hover:shadow-lg`}>
      <Link href={href || '#'}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></span>
              <span className={`text-sm font-medium ${connected ? c.text : 'text-gray-500'}`}>
                {connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Expanded Details */}
      {connected && (
        <div className="bg-white/60 rounded-lg p-3 mb-4 space-y-2 text-sm">
          {lastSync && (
            <p className="text-gray-700">
              <span className="font-medium">Last Sync:</span>{' '}
              {new Date(lastSync).toLocaleString()}
            </p>
          )}
          {status && (
            <p className="text-gray-700">
              <span className="font-medium">Status:</span> {status}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={href || '#'} className="flex-1">
          <button className={`w-full ${c.button} text-white px-4 py-2 rounded-lg font-medium transition-colors`}>
            Manage →
          </button>
        </Link>

        {connected && (
          <>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`${c.button} disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors`}
              title="Sync now"
            >
              {isSyncing ? '⟳' : '↻'}
            </button>
            <button
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              title="Disconnect"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
