import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const rateLimitAPI = {
  getUserStatus: async () => {
    const response = await axios.get(`${API_BASE}/rate-limit/status`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getRules: async (isActive = null) => {
    const params = isActive !== null ? { isActive } : {};
    const response = await axios.get(`${API_BASE}/rate-limit/rules`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  },

  createRule: async (ruleData) => {
    const response = await axios.post(`${API_BASE}/rate-limit/rules`, ruleData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateRule: async (ruleId, ruleData) => {
    const response = await axios.put(`${API_BASE}/rate-limit/rules/${ruleId}`, ruleData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deleteRule: async (ruleId) => {
    const response = await axios.delete(`${API_BASE}/rate-limit/rules/${ruleId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getStats: async (userId = null, ipAddress = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (ipAddress) params.ipAddress = ipAddress;

    const response = await axios.get(`${API_BASE}/rate-limit/stats`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  },

  unblockIdentifier: async (userId = null, ipAddress = null) => {
    const response = await axios.post(`${API_BASE}/rate-limit/unblock`, {
      userId,
      ipAddress
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  cleanupOldLimits: async () => {
    const response = await axios.post(`${API_BASE}/rate-limit/cleanup`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default rateLimitAPI;
