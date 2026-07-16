import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const customDomainAPI = {
  validateDomain: async (domain) => {
    const response = await axios.post(`${API_BASE}/custom-domain/validate`, {
      domain
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  addDomain: async (domain, subdomain = null, blogId = null) => {
    const response = await axios.post(`${API_BASE}/custom-domain/add`, {
      domain,
      subdomain,
      blogId
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getDomains: async (status = null) => {
    const params = {};
    if (status) params.status = status;

    const response = await axios.get(`${API_BASE}/custom-domain/list`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  },

  getDomain: async (domainId) => {
    const response = await axios.get(`${API_BASE}/custom-domain/${domainId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  verifyDomain: async (domainId) => {
    const response = await axios.post(`${API_BASE}/custom-domain/${domainId}/verify`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateDomain: async (domainId, updates) => {
    const response = await axios.put(`${API_BASE}/custom-domain/${domainId}`, updates, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deleteDomain: async (domainId) => {
    const response = await axios.delete(`${API_BASE}/custom-domain/${domainId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getDomainStats: async (domainId) => {
    const response = await axios.get(`${API_BASE}/custom-domain/${domainId}/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default customDomainAPI;
