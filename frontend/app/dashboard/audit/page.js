'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, Download } from 'lucide-react';
import auditAPI from '@/lib/audit-api';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );

      const result = await auditAPI.getAuditLog(pagination.limit, pagination.skip, filterParams);
      setLogs(result.logs);
      setPagination({
        ...pagination,
        total: result.total,
        skip: result.skip
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await auditAPI.getAuditSummary(7);
      setSummary(result);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, skip: 0 });
  };

  const applyFilters = () => {
    setPagination({ ...pagination, skip: 0 });
    loadLogs();
  };

  const resetFilters = () => {
    setFilters({
      actionType: '',
      resourceType: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setPagination({ ...pagination, skip: 0 });
  };

  const exportToCSV = () => {
    const headers = ['User', 'Action', 'Resource', 'Status', 'IP Address', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log =>
        [
          log.userId?.name || 'Unknown',
          log.actionType,
          log.resourceType,
          log.status,
          log.ipAddress || 'N/A',
          new Date(log.createdAt).toISOString()
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionColor = (actionType) => {
    const colors = {
      'login': 'bg-blue-100 text-blue-800',
      'logout': 'bg-gray-100 text-gray-800',
      'login_failed': 'bg-red-100 text-red-800',
      'account_locked': 'bg-red-100 text-red-800',
      'password_changed': 'bg-yellow-100 text-yellow-800',
      'blog_created': 'bg-green-100 text-green-800',
      'blog_published': 'bg-green-100 text-green-800',
      'blog_approved': 'bg-green-100 text-green-800',
      'blog_rejected': 'bg-red-100 text-red-800'
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-2">Track all system activities and user actions</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Top Actions</h3>
            <div className="space-y-2">
              {summary.actionCounts.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-sm text-gray-700">{item._id}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Resource Types</h3>
            <div className="space-y-2">
              {summary.resourceCounts.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-sm text-gray-700">{item._id}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Top Users</h3>
            <div className="space-y-2">
              {summary.topUsers.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-sm text-gray-700">{item.user?.[0]?.name || 'Unknown'}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="blog_created">Blog Created</option>
              <option value="blog_approved">Blog Approved</option>
              <option value="blog_published">Blog Published</option>
            </select>

            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="blog">Blog</option>
              <option value="role">Role</option>
              <option value="settings">Settings</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Resource</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">IP Address</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{log.userId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.actionType)}`}>
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">{log.resourceType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{log.ipAddress || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total} logs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                  disabled={pagination.skip === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => { setPagination({ ...pagination, skip: pagination.skip + pagination.limit }); loadLogs(); }}
                  disabled={pagination.skip + pagination.limit >= pagination.total}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
