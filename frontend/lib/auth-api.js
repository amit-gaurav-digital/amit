import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const authAPI = {
  register: async (email, password, name) => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email,
      password,
      name
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  logout: async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  changePassword: async (oldPassword, newPassword) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/auth/change-password`, {
      oldPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email
    });
    return response.data;
  },

  resetPassword: async (resetToken, newPassword) => {
    const response = await axios.post(`${API_BASE}/auth/reset-password`, {
      resetToken,
      newPassword
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken
    });
    return response.data;
  },

  verify: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default authAPI;
