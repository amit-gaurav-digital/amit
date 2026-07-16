'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, AlertCircle, Lock, Unlock, RefreshCw } from 'lucide-react';
import rateLimitAPI from '@/lib/rateLimit-api';

export default function RateLimitingPage() {
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [unblockIdentifier, setUnblockIdentifier] = useState({ type: 'userId', value: '' });
  const [filterActive, setFilterActive] = useState(null);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    endpoint: '',
    method: 'ALL',
    userRole: 'all',
    requestsPerWindow: 100,
    windowDurationSeconds: 3600,
    blockDurationSeconds: 3600,
    blockMessage: 'Rate limit exceeded. Please try again later.',
    bypassRoles: []
  });

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL'];
  const roles = ['anonymous', 'user', 'admin', 'all'];

  useEffect(() => {
    loadRules();
    loadStats();
    loadUserStatus();
  }, []);

  useEffect(() => {
    if (filterActive !== null) {
      loadRules(filterActive);
    }
  }, [filterActive]);

  const loadRules = async (isActive = null) => {
    setLoading(true);
    try {
      const rulesData = await rateLimitAPI.getRules(isActive);
      setRules(rulesData);
      setError('');
    } catch (err) {
      setError('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await rateLimitAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const loadUserStatus = async () => {
    try {
      const status = await rateLimitAPI.getUserStatus();
      setUserStatus(status);
    } catch (err) {
      console.error('Failed to load user status');
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.endpoint || !newRule.requestsPerWindow || !newRule.windowDurationSeconds) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await rateLimitAPI.createRule(newRule);
      setSuccessMessage('Rule created successfully');
      setShowNewRuleModal(false);
      setNewRule({
        name: '',
        description: '',
        endpoint: '',
        method: 'ALL',
        userRole: 'all',
        requestsPerWindow: 100,
        windowDurationSeconds: 3600,
        blockDurationSeconds: 3600,
        blockMessage: 'Rate limit exceeded. Please try again later.',
        bypassRoles: []
      });
      loadRules(filterActive);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule.name || !editingRule.endpoint || !editingRule.requestsPerWindow || !editingRule.windowDurationSeconds) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await rateLimitAPI.updateRule(editingRule._id, editingRule);
      setSuccessMessage('Rule updated successfully');
      setEditingRule(null);
      loadRules(filterActive);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (confirm('Delete this rule?')) {
      try {
        await rateLimitAPI.deleteRule(ruleId);
        setSuccessMessage('Rule deleted successfully');
        loadRules(filterActive);
      } catch (err) {
        setError('Failed to delete rule');
      }
    }
  };

  const handleUnblock = async () => {
    if (!unblockIdentifier.value) {
      setError('Please enter an identifier');
      return;
    }

    try {
      const params = unblockIdentifier.type === 'userId'
        ? { userId: unblockIdentifier.value }
        : { ipAddress: unblockIdentifier.value };

      await rateLimitAPI.unblockIdentifier(params.userId, params.ipAddress);
      setSuccessMessage('Identifier unblocked');
      setShowUnblockModal(false);
      setUnblockIdentifier({ type: 'userId', value: '' });
      loadStats();
    } catch (err) {
      setError('Failed to unblock identifier');
    }
  };

  const handleCleanup = async () => {
    if (confirm('Delete old rate limit records (older than 7 days)?')) {
      try {
        const result = await rateLimitAPI.cleanupOldLimits();
        setSuccessMessage(`Deleted ${result.deletedCount} old records`);
        loadStats();
      } catch (err) {
        setError('Failed to cleanup old records');
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Rate Limiting</h1>
        <p className="text-gray-600 mt-2">Configure and monitor request rate limits to prevent abuse</p>
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

      {/* User Status */}
      {userStatus && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rate Limit Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-600 font-semibold text-sm">Total Requests (Recent)</div>
              <div className="text-3xl font-bold text-blue-900 mt-2">{userStatus.totalRequests}</div>
            </div>

            <div className={`p-4 rounded-lg border ${userStatus.blocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`font-semibold text-sm ${userStatus.blocked ? 'text-red-600' : 'text-green-600'}`}>
                {userStatus.blocked ? 'Currently Blocked' : 'Not Blocked'}
              </div>
              {userStatus.blocked ? (
                <div className="text-red-900 mt-2">⚠️ You are currently rate limited on some endpoints</div>
              ) : (
                <div className="text-green-900 mt-2">✓ All endpoints available</div>
              )}
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-purple-600 font-semibold text-sm">Limited Endpoints</div>
              <div className="text-3xl font-bold text-purple-900 mt-2">{userStatus.limitedEndpoints.length}</div>
            </div>
          </div>

          {userStatus.limitedEndpoints.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Details:</h3>
              <div className="space-y-2">
                {userStatus.limitedEndpoints.map((ep, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{ep.endpoint} ({ep.method})</div>
                    <div className="text-gray-600 mt-1">
                      Requests: {ep.requests} | Status: {ep.isBlocked ? 'Blocked' : 'Limited'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Requests Tracked</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Currently Blocked</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.blockedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Monitored Endpoints</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.topEndpoints.length}</div>
          </div>
        </div>
      )}

      {/* Top Endpoints */}
      {stats && stats.topEndpoints.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Endpoints by Request Volume</h2>

          <div className="space-y-3">
            {stats.topEndpoints.map((ep, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{ep.endpoint}</div>
                    <div className="text-sm text-gray-600">{ep.method}</div>
                  </div>
                  {ep.blocked && (
                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Blocked
                    </div>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((ep.requests / stats.totalRequests) * 100, 100)}%` }}></div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{ep.requests} requests</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Blocks */}
      {stats && stats.recentBlocks.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Blocks</h2>

          <div className="space-y-3">
            {stats.recentBlocks.map((block, idx) => (
              <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{block.endpoint} ({block.method})</div>
                    <div className="text-sm text-gray-600 mt-1">{block.reason}</div>
                    <div className="text-xs text-gray-500 mt-1">Blocked until: {new Date(block.blockedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Section */}
      <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Rate Limit Rules</h2>
          <button
            onClick={() => setShowNewRuleModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Rule
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
          <div className="p-6 text-center text-gray-600">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No rules configured</p>
          </div>
        ) : (
          <div className="divide-y">
            {rules.map(rule => (
              <div key={rule._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{rule.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Endpoint:</span>
                    <div className="font-mono text-gray-900 text-xs">{rule.endpoint}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <div className="font-semibold text-gray-900">{rule.method}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Limit:</span>
                    <div className="font-semibold text-gray-900">{rule.requestsPerWindow} reqs</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Window:</span>
                    <div className="font-semibold text-gray-900">{Math.floor(rule.windowDurationSeconds / 60)} min</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {rule.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Inactive</span>
                  )}
                  {rule.bypassRoles.length > 0 && (
                    <span className="text-xs text-gray-600">Bypass: {rule.bypassRoles.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleCleanup}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Cleanup Old Records
          </button>
          <button
            onClick={() => setShowUnblockModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium"
          >
            <Unlock className="w-4 h-4" />
            Unblock Identifier
          </button>
        </div>
      </div>

      {/* New Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-6">Create New Rate Limit Rule</h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Rule Name *</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., api_write_user"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Endpoint *</label>
                <input
                  type="text"
                  value={newRule.endpoint}
                  onChange={(e) => setNewRule({ ...newRule, endpoint: e.target.value })}
                  placeholder="e.g., /api/blog"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Method</label>
                  <select
                    value={newRule.method}
                    onChange={(e) => setNewRule({ ...newRule, method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {methods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">User Role</label>
                  <select
                    value={newRule.userRole}
                    onChange={(e) => setNewRule({ ...newRule, userRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Requests Per Window *</label>
                  <input
                    type="number"
                    value={newRule.requestsPerWindow}
                    onChange={(e) => setNewRule({ ...newRule, requestsPerWindow: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Window Duration (seconds) *</label>
                  <input
                    type="number"
                    value={newRule.windowDurationSeconds}
                    onChange={(e) => setNewRule({ ...newRule, windowDurationSeconds: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Block Duration (seconds)</label>
                <input
                  type="number"
                  value={newRule.blockDurationSeconds}
                  onChange={(e) => setNewRule({ ...newRule, blockDurationSeconds: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Block Message</label>
                <textarea
                  value={newRule.blockMessage}
                  onChange={(e) => setNewRule({ ...newRule, blockMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateRule}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Create Rule
              </button>
              <button
                onClick={() => {
                  setShowNewRuleModal(false);
                  setNewRule({
                    name: '',
                    description: '',
                    endpoint: '',
                    method: 'ALL',
                    userRole: 'all',
                    requestsPerWindow: 100,
                    windowDurationSeconds: 3600,
                    blockDurationSeconds: 3600,
                    blockMessage: 'Rate limit exceeded. Please try again later.',
                    bypassRoles: []
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

      {/* Unblock Modal */}
      {showUnblockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Unblock Identifier</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Identifier Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={unblockIdentifier.type === 'userId'}
                      onChange={() => setUnblockIdentifier({ ...unblockIdentifier, type: 'userId' })}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">User ID</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={unblockIdentifier.type === 'ipAddress'}
                      onChange={() => setUnblockIdentifier({ ...unblockIdentifier, type: 'ipAddress' })}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">IP Address</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {unblockIdentifier.type === 'userId' ? 'User ID' : 'IP Address'}
                </label>
                <input
                  type="text"
                  value={unblockIdentifier.value}
                  onChange={(e) => setUnblockIdentifier({ ...unblockIdentifier, value: e.target.value })}
                  placeholder={unblockIdentifier.type === 'userId' ? 'e.g., 507f1f77bcf86cd799439011' : 'e.g., 192.168.1.1'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUnblock}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                Unblock
              </button>
              <button
                onClick={() => {
                  setShowUnblockModal(false);
                  setUnblockIdentifier({ type: 'userId', value: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-6">Edit Rule: {editingRule.name}</h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Rule Name</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Requests Per Window</label>
                <input
                  type="number"
                  value={editingRule.requestsPerWindow}
                  onChange={(e) => setEditingRule({ ...editingRule, requestsPerWindow: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Window Duration (seconds)</label>
                <input
                  type="number"
                  value={editingRule.windowDurationSeconds}
                  onChange={(e) => setEditingRule({ ...editingRule, windowDurationSeconds: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Block Duration (seconds)</label>
                <input
                  type="number"
                  value={editingRule.blockDurationSeconds}
                  onChange={(e) => setEditingRule({ ...editingRule, blockDurationSeconds: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingRule.isActive}
                    onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateRule}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Update Rule
              </button>
              <button
                onClick={() => setEditingRule(null)}
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
