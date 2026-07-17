import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
};

const blogAPI = {
  getBlogs: async () => {
    try {
      const response = await axios.get(`${API_BASE}/blogs`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBlog: async (blogId) => {
    try {
      const response = await axios.get(`${API_BASE}/blogs/${blogId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createBlog: async (title, description) => {
    try {
      const response = await axios.post(
        `${API_BASE}/blogs`,
        { title, description },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateBlog: async (blogId, data) => {
    try {
      const response = await axios.put(
        `${API_BASE}/blogs/${blogId}`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteBlog: async (blogId) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/blogs/${blogId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default blogAPI;
