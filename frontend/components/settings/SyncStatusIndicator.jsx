'use client';

export default function SyncStatusIndicator({
  status = 'idle',
  lastSync = null,
  nextSync = null,
  errorCount = 0,
  lastError = null
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: '⟳',
          label: 'Syncing...',
          pulse: true
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✓',
          label: 'Synced',
          pulse: false
        };
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '✕',
          label: 'Failed',
          pulse: false
        };
      case 'needs_attention':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '⚠',
          label: 'Needs Attention',
          pulse: false
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '○',
          label: 'Idle',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`border rounded-lg p-4 ${config.color}`}>
      {/* Status Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`text-xl ${config.pulse ? 'animate-pulse' : ''}`}>
          {config.icon}
        </div>
        <span className="font-medium">{config.label}</span>
      </div>

      {/* Status Details */}
      <div className="space-y-2 text-sm">
        {lastSync && (
          <div className="flex justify-between">
            <span className="font-medium">Last Sync:</span>
            <span>{new Date(lastSync).toLocaleString()}</span>
          </div>
        )}

        {nextSync && (
          <div className="flex justify-between">
            <span className="font-medium">Next Sync:</span>
            <span>{new Date(nextSync).toLocaleString()}</span>
          </div>
        )}

        {errorCount > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="font-medium mb-2">Recent Errors: {errorCount}</p>
            {lastError && (
              <p className="text-xs opacity-75 bg-black/10 rounded px-2 py-1">
                {lastError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar for Syncing */}
      {status === 'syncing' && (
        <div className="mt-4">
          <div className="w-full bg-black/10 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
