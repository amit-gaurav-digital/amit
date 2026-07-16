'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, CheckCircle, XCircle, Zap, Target } from 'lucide-react';
import abTestingAPI from '@/lib/abtesting-api';
import blogAPI from '@/lib/api';

export default function ABTestingPage() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testType: 'headline',
    testField: '',
    variants: [
      { name: 'Control', value: '', label: 'A', isControl: true },
      { name: 'Variant', value: '', label: 'B', isControl: false }
    ],
    configuration: {
      splitPercentage: 50,
      minSampleSize: 100,
      confidenceLevel: 0.95,
      duration: 7,
      autoSelect: false,
      autoSelectThreshold: 0.05
    }
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      loadTests();
    }
  }, [selectedBlog, filter]);

  const loadBlogs = async () => {
    try {
      const response = await blogAPI.getBlogs(50, 0);
      setBlogs(response.blogs);
      if (response.blogs.length > 0) {
        setSelectedBlog(response.blogs[0]._id);
      }
    } catch (err) {
      setError('Failed to load blogs');
    }
  };

  const loadTests = async () => {
    setLoading(true);
    try {
      const testList = await abTestingAPI.getTestsForBlog(
        selectedBlog,
        filter === 'all' ? null : filter
      );
      setTests(testList);
      setError('');
    } catch (err) {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      await abTestingAPI.createTest({
        blogId: selectedBlog,
        ...formData
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        testType: 'headline',
        testField: '',
        variants: [
          { name: 'Control', value: '', label: 'A', isControl: true },
          { name: 'Variant', value: '', label: 'B', isControl: false }
        ],
        configuration: {
          splitPercentage: 50,
          minSampleSize: 100,
          confidenceLevel: 0.95,
          duration: 7,
          autoSelect: false,
          autoSelectThreshold: 0.05
        }
      });
      await loadTests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create test');
    }
  };

  const handleStartTest = async (testId) => {
    try {
      await abTestingAPI.startTest(testId);
      await loadTests();
    } catch (err) {
      setError('Failed to start test');
    }
  };

  const handleStopTest = async (testId) => {
    try {
      await abTestingAPI.stopTest(testId);
      await loadTests();
    } catch (err) {
      setError('Failed to stop test');
    }
  };

  const handleCompleteTest = async (testId) => {
    try {
      await abTestingAPI.completeTest(testId, true);
      await loadTests();
    } catch (err) {
      setError('Failed to complete test');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Zap className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
        <p className="text-gray-600 mt-2">Test different headlines and content variations</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-4 items-center">
        <select
          value={selectedBlog}
          onChange={(e) => setSelectedBlog(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {blogs.map(blog => (
            <option key={blog._id} value={blog._id}>
              {blog.title}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {['all', 'draft', 'running', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Test
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No tests found for this blog</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create your first test
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {tests.map(test => (
            <div key={test._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)}
                      {test.status}
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-gray-600 text-sm">{test.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>Type: <strong className="capitalize">{test.testType}</strong></span>
                    <span>Field: <strong>{test.testField}</strong></span>
                    <span>Duration: <strong>{test.configuration.duration} days</strong></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {test.status === 'draft' && (
                    <button
                      onClick={() => handleStartTest(test._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                  )}

                  {test.status === 'running' && (
                    <>
                      <button
                        onClick={() => handleStopTest(test._id)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => handleCompleteTest(test._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Variants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {test.variants.map((variant, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{variant.name}</p>
                        <p className="text-xs text-gray-600 mt-1">Variant {variant.label}</p>
                      </div>
                      {variant.isControl && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Control
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 break-words">{variant.value}</p>
                  </div>
                ))}
              </div>

              {/* Test Results */}
              {test.status !== 'draft' && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-semibold text-gray-900">
                        {test.results.startedAt ? new Date(test.results.startedAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900 capitalize">{test.results.status}</p>
                    </div>
                    {test.results.winner && (
                      <>
                        <div>
                          <p className="text-gray-600">Winner</p>
                          <p className="font-semibold text-green-600">{test.results.winner.variantName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Improvement</p>
                          <p className="font-semibold text-green-600">{test.results.winner.improvement.toFixed(2)}%</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create A/B Test</h2>

            <form onSubmit={handleCreateTest}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Test Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Test Type</label>
                  <select
                    value={formData.testType}
                    onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="headline">Headline</option>
                    <option value="content">Content</option>
                    <option value="image">Featured Image</option>
                    <option value="cta">Call to Action</option>
                    <option value="meta-description">Meta Description</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Field Name</label>
                <input
                  type="text"
                  value={formData.testField}
                  onChange={(e) => setFormData({ ...formData, testField: e.target.value })}
                  placeholder="e.g., title, excerpt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Variants</h3>
                {formData.variants.map((variant, idx) => (
                  <div key={idx} className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Variant {variant.label} {variant.isControl && '(Control)'}
                    </label>
                    <textarea
                      value={variant.value}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[idx].value = e.target.value;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      rows="2"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.configuration.duration}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, duration: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Confidence Level</label>
                  <select
                    value={formData.configuration.confidenceLevel}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, confidenceLevel: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value={0.90}>90%</option>
                    <option value={0.95}>95%</option>
                    <option value={0.99}>99%</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center mb-6">
                <input
                  type="checkbox"
                  checked={formData.configuration.autoSelect}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, autoSelect: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-gray-700">Automatically select winner when test completes</span>
              </label>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Create Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
