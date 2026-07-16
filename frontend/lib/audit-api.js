import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const auditAPI = {
  getAuditLog: async (limit = 50, skip = 0, filters = {}) => {
    const params = new URLSearchParams({
      limit,
      skip,
      ...filters
    });

    const response = await axios.get(`${API_BASE}/audit?${params}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getUserAuditLog: async (userId, limit = 50, skip = 0) => {
    const response = await axios.get(`${API_BASE}/audit/user/${userId}?limit=${limit}&skip=${skip}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getResourceAuditLog: async (resourceType, resourceId, limit = 50, skip = 0) => {
    const response = await axios.get(`${API_BASE}/audit/resource/${resourceType}/${resourceId}?limit=${limit}&skip=${skip}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAuditSummary: async (days = 7) => {
    const response = await axios.get(`${API_BASE}/audit/summary?days=${days}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAuditTimeline: async (limit = 100) => {
    const response = await axios.get(`${API_BASE}/audit/timeline?limit=${limit}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default auditAPI;
