import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const cacheAPI = {
  getCacheStats: async (endpoint = null, method = null, days = 30) => {
    const params = { days };
    if (endpoint) params.endpoint = endpoint;
    if (method) params.method = method;

    const response = await axios.get(`${API_BASE}/cache/stats`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  },

  getGlobalStats: async () => {
    const response = await axios.get(`${API_BASE}/cache/global-stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getMemoryStats: async () => {
    const response = await axios.get(`${API_BASE}/cache/memory-stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getCacheConfigs: async (isActive = null) => {
    const params = {};
    if (isActive !== null) params.isActive = isActive;

    const response = await axios.get(`${API_BASE}/cache/configs`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  },

  createCacheConfig: async (configData) => {
    const response = await axios.post(`${API_BASE}/cache/configs`, configData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateCacheConfig: async (configId, configData) => {
    const response = await axios.put(`${API_BASE}/cache/configs/${configId}`, configData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deleteCacheConfig: async (configId) => {
    const response = await axios.delete(`${API_BASE}/cache/configs/${configId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  invalidateCache: async (endpoint, method = null) => {
    const response = await axios.post(`${API_BASE}/cache/invalidate`, {
      endpoint,
      method
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  invalidateCachePattern: async (pattern) => {
    const response = await axios.post(`${API_BASE}/cache/invalidate-pattern`, {
      pattern
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  clearCache: async () => {
    const response = await axios.post(`${API_BASE}/cache/clear`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  clearExpiredCache: async () => {
    const response = await axios.post(`${API_BASE}/cache/clear-expired`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default cacheAPI;
