import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const abTestingAPI = {
  createTest: async (testData) => {
    const response = await axios.post(`${API_BASE}/ab-testing`, testData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getTestsForBlog: async (blogId, status = null) => {
    const url = status
      ? `${API_BASE}/ab-testing/blog/${blogId}?status=${status}`
      : `${API_BASE}/ab-testing/blog/${blogId}`;

    const response = await axios.get(url, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getActiveTests: async (blogId) => {
    const response = await axios.get(`${API_BASE}/ab-testing/blog/${blogId}/active`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getTestResults: async (testId) => {
    const response = await axios.get(`${API_BASE}/ab-testing/${testId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  startTest: async (testId) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/start`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  stopTest: async (testId) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/stop`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  completeTest: async (testId, autoSelect = false) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/complete`, {
      autoSelect
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  cancelTest: async (testId) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/cancel`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateConfiguration: async (testId, configuration) => {
    const response = await axios.put(`${API_BASE}/ab-testing/${testId}/configuration`, {
      configuration
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  recordEvent: async (testId, variantId, eventType, data = {}) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/event`, {
      variantId,
      eventType,
      data
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  analyzeResults: async (testId) => {
    const response = await axios.post(`${API_BASE}/ab-testing/${testId}/analyze`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getVariantAssignment: async (testId, userId) => {
    const response = await axios.get(`${API_BASE}/ab-testing/${testId}/assignment/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  trackEvent: async (testId, variantId, eventType) => {
    try {
      await abTestingAPI.recordEvent(testId, variantId, eventType);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
};

export default abTestingAPI;
