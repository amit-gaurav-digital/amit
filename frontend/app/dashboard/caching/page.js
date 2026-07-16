'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Edit2, Trash2, RefreshCw, Trash, AlertCircle } from 'lucide-react';
import cacheAPI from '@/lib/cache-api';

export default function CachingPage() {
  const [stats, setStats] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewConfigModal, setShowNewConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [filterActive, setFilterActive] = useState(null);
  const [days, setDays] = useState(30);

  const [newConfig, setNewConfig] = useState({
    key: '',
    endpoint: '',
    method: 'GET',
    ttlSeconds: 300,
    strategy: 'hybrid',
    cacheable: true,
    description: '',
    maxSize: 1000000,
    queryParamsDontAffect: []
  });

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'ALL'];
  const strategies = ['memory', 'database', 'hybrid'];

  useEffect(() => {
    loadStats();
    loadMemoryStats();
    loadConfigs();
  }, [days]);

  useEffect(() => {
    if (filterActive !== null) {
      loadConfigs(filterActive);
    }
  }, [filterActive]);

  const loadStats = async () => {
    try {
      const statsData = await cacheAPI.getCacheStats(null, null, days);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const loadMemoryStats = async () => {
    try {
      const memStats = await cacheAPI.getMemoryStats();
      setMemoryStats(memStats);
    } catch (err) {
      console.error('Failed to load memory stats');
    }
  };

  const loadConfigs = async (isActive = null) => {
    setLoading(true);
    try {
      const configsData = await cacheAPI.getCacheConfigs(isActive);
      setConfigs(configsData);
      setError('');
    } catch (err) {
      setError('Failed to load cache configs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!newConfig.key || !newConfig.endpoint || !newConfig.ttlSeconds) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await cacheAPI.createCacheConfig(newConfig);
      setSuccessMessage('Cache configuration created');
      setShowNewConfigModal(false);
      setNewConfig({
        key: '',
        endpoint: '',
        method: 'GET',
        ttlSeconds: 300,
        strategy: 'hybrid',
        cacheable: true,
        description: '',
        maxSize: 1000000,
        queryParamsDontAffect: []
      });
      loadConfigs(filterActive);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create config');
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig.key || !editingConfig.endpoint || !editingConfig.ttlSeconds) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await cacheAPI.updateCacheConfig(editingConfig._id, editingConfig);
      setSuccessMessage('Cache configuration updated');
      setEditingConfig(null);
      loadConfigs(filterActive);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update config');
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (confirm('Delete this cache configuration?')) {
      try {
        await cacheAPI.deleteCacheConfig(configId);
        setSuccessMessage('Cache configuration deleted');
        loadConfigs(filterActive);
      } catch (err) {
        setError('Failed to delete config');
      }
    }
  };

  const handleInvalidateEndpoint = async (endpoint) => {
    if (confirm(`Invalidate cache for ${endpoint}?`)) {
      try {
        const result = await cacheAPI.invalidateCache(endpoint);
        setSuccessMessage(`Invalidated ${result.invalidatedCount} cache entries`);
        loadStats();
        loadMemoryStats();
      } catch (err) {
        setError('Failed to invalidate cache');
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all cached data? This action cannot be undone.')) {
      try {
        const result = await cacheAPI.clearCache();
        setSuccessMessage(`Cleared ${result.clearedCount} cache entries`);
        loadStats();
        loadMemoryStats();
      } catch (err) {
        setError('Failed to clear cache');
      }
    }
  };

  const handleClearExpired = async () => {
    try {
      const result = await cacheAPI.clearExpiredCache();
      setSuccessMessage(`Cleared ${result.clearedCount} expired entries`);
      loadStats();
      loadMemoryStats();
    } catch (err) {
      setError('Failed to clear expired cache');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Caching</h1>
        <p className="text-gray-600 mt-2">Configure and monitor application caching for improved performance</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded border bg-red-50 border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded border bg-green-50 border-green-200 text-green-700 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Cache Hit Rate</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.hitRate}%</div>
            <div className="text-xs text-gray-500 mt-2">Last {days} days</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Hits</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.totalHits.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Misses</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{stats.totalMisses.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Avg Response Time</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats.averageResponseTime}ms</div>
          </div>
        </div>
      )}

      {/* Memory Usage */}
      {memoryStats && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cache Memory Usage</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-gray-600 text-sm font-medium mb-2">Cached Items</div>
              <div className="text-4xl font-bold text-gray-900">{memoryStats.itemCount}</div>
            </div>

            <div>
              <div className="text-gray-600 text-sm font-medium mb-2">Total Size</div>
              <div className="text-4xl font-bold text-gray-900">{memoryStats.totalSizeKB.toLocaleString()} KB</div>
              <div className="text-sm text-gray-600 mt-1">({memoryStats.totalSizeMB} MB)</div>
            </div>

            <div>
              <div className="text-gray-600 text-sm font-medium mb-2">Average Item Size</div>
              <div className="text-4xl font-bold text-gray-900">
                {memoryStats.itemCount > 0 ? Math.round(memoryStats.totalSize / memoryStats.itemCount) : 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">bytes</div>
            </div>
          </div>
        </div>
      )}

      {/* Response Time Comparison */}
      {stats && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Response Time Impact</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-600 text-sm font-medium mb-3">Cached Response Time</div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-green-600">{stats.cachedResponseTime}ms</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${Math.min((stats.cachedResponseTime / (stats.uncachedResponseTime || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-gray-600 text-sm font-medium mb-3">Uncached Response Time</div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-red-600">{stats.uncachedResponseTime}ms</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-red-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <strong>Performance Gain:</strong> {stats.uncachedResponseTime > 0 ? Math.round(((stats.uncachedResponseTime - stats.cachedResponseTime) / stats.uncachedResponseTime) * 100) : 0}% faster with caching
          </div>
        </div>
      )}

      {/* Top Endpoints */}
      {stats && stats.endpoints.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cached Endpoints</h2>

          <div className="space-y-4">
            {stats.endpoints.slice(0, 5).map((ep, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{ep.endpoint}</div>
                    <div className="text-sm text-gray-600">{ep.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{ep.hitRate}%</div>
                    <div className="text-xs text-gray-600">hit rate</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>Hits: {ep.hits.toLocaleString()} | Misses: {ep.misses.toLocaleString()}</div>
                  <button
                    onClick={() => handleInvalidateEndpoint(ep.endpoint)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Invalidate
                  </button>
                </div>

                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${ep.hitRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Configurations */}
      <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Cache Configurations</h2>
          <button
            onClick={() => setShowNewConfigModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Configuration
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterActive === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterActive === true ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterActive === false ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Inactive
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading configurations...</div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No cache configurations</p>
          </div>
        ) : (
          <div className="divide-y">
            {configs.map(config => (
              <div key={config._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.key}</h3>
                    <p className="text-gray-600 text-sm mt-1">{config.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Endpoint:</span>
                    <div className="font-mono text-gray-900 text-xs">{config.endpoint}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <div className="font-semibold text-gray-900">{config.method}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">TTL:</span>
                    <div className="font-semibold text-gray-900">{config.ttlSeconds}s</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Strategy:</span>
                    <div className="font-semibold text-gray-900 capitalize">{config.strategy}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Size:</span>
                    <div className="font-semibold text-gray-900">{Math.round(config.maxSize / 1024)} KB</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {config.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Inactive</span>
                  )}
                  {!config.cacheable && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Not Cacheable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleClearExpired}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Clear Expired
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium"
          >
            <Trash className="w-4 h-4" />
            Clear All Cache
          </button>
          <div className="flex-1"></div>
          <div className="text-sm text-gray-600 py-2">
            Days: <input type="number" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 30)} min="1" max="365" className="w-12 px-2 py-1 border border-gray-300 rounded" />
          </div>
        </div>
      </div>

      {/* New Config Modal */}
      {showNewConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-6">Create Cache Configuration</h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Config Key *</label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                  placeholder="e.g., blogs_list"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Endpoint *</label>
                <input
                  type="text"
                  value={newConfig.endpoint}
                  onChange={(e) => setNewConfig({ ...newConfig, endpoint: e.target.value })}
                  placeholder="e.g., /api/blog"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Method</label>
                  <select
                    value={newConfig.method}
                    onChange={(e) => setNewConfig({ ...newConfig, method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {methods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Strategy</label>
                  <select
                    value={newConfig.strategy}
                    onChange={(e) => setNewConfig({ ...newConfig, strategy: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">TTL (seconds) *</label>
                <input
                  type="number"
                  value={newConfig.ttlSeconds}
                  onChange={(e) => setNewConfig({ ...newConfig, ttlSeconds: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Max Size (bytes)</label>
                <input
                  type="number"
                  value={newConfig.maxSize}
                  onChange={(e) => setNewConfig({ ...newConfig, maxSize: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newConfig.cacheable}
                    onChange={(e) => setNewConfig({ ...newConfig, cacheable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">Cacheable</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateConfig}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Create Configuration
              </button>
              <button
                onClick={() => {
                  setShowNewConfigModal(false);
                  setNewConfig({
                    key: '',
                    endpoint: '',
                    method: 'GET',
                    ttlSeconds: 300,
                    strategy: 'hybrid',
                    cacheable: true,
                    description: '',
                    maxSize: 1000000,
                    queryParamsDontAffect: []
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-6">Edit Cache Configuration</h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-gray-700 font-medium mb-2">TTL (seconds)</label>
                <input
                  type="number"
                  value={editingConfig.ttlSeconds}
                  onChange={(e) => setEditingConfig({ ...editingConfig, ttlSeconds: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Max Size (bytes)</label>
                <input
                  type="number"
                  value={editingConfig.maxSize}
                  onChange={(e) => setEditingConfig({ ...editingConfig, maxSize: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingConfig.isActive}
                    onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">Active</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingConfig.cacheable}
                    onChange={(e) => setEditingConfig({ ...editingConfig, cacheable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">Cacheable</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateConfig}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Update Configuration
              </button>
              <button
                onClick={() => setEditingConfig(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
