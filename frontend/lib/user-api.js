import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const userAPI = {
  getAllUsers: async (limit = 50, skip = 0) => {
    const response = await axios.get(`${API_BASE}/users?limit=${limit}&skip=${skip}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  searchUsers: async (query, role = null, isActive = true, limit = 50, skip = 0) => {
    const response = await axios.post(`${API_BASE}/users/search`, {
      query,
      role,
      isActive,
      limit,
      skip
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateUser: async (userId, updateData) => {
    const response = await axios.put(`${API_BASE}/users/${userId}`, updateData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  createUser: async (email, password, name, role, department) => {
    const response = await axios.post(`${API_BASE}/users`, {
      email,
      password,
      name,
      role,
      department
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  assignRole: async (userId, role) => {
    const response = await axios.put(`${API_BASE}/users/${userId}/role`, {
      role
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await axios.post(`${API_BASE}/users/${userId}/deactivate`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await axios.post(`${API_BASE}/users/${userId}/activate`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getUserStats: async (userId) => {
    const response = await axios.get(`${API_BASE}/users/${userId}/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getUserAudit: async (userId, limit = 50, skip = 0) => {
    const response = await axios.get(`${API_BASE}/users/${userId}/audit?limit=${limit}&skip=${skip}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  bulkAssignRole: async (userIds, role) => {
    const response = await axios.post(`${API_BASE}/users/bulk/assign-role`, {
      userIds,
      role
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  bulkDeactivateUsers: async (userIds) => {
    const response = await axios.post(`${API_BASE}/users/bulk/deactivate`, {
      userIds
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default userAPI;
