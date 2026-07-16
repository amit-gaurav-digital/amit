import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const socialMediaAPI = {
  connectAccount: async (platform, tokenData, profile) => {
    const response = await axios.post(`${API_BASE}/social-media/connect/${platform}`, {
      tokenData,
      profile
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  disconnectAccount: async (platform) => {
    const response = await axios.post(`${API_BASE}/social-media/disconnect/${platform}`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getConnectedAccounts: async () => {
    const response = await axios.get(`${API_BASE}/social-media/accounts`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  postToSocialMedia: async (blogId, platforms, customContent = {}) => {
    const response = await axios.post(`${API_BASE}/social-media/post/${blogId}`, {
      platforms,
      customContent
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  schedulePost: async (blogId, platforms, scheduledFor, customContent = {}) => {
    const response = await axios.post(`${API_BASE}/social-media/schedule/${blogId}`, {
      platforms,
      scheduledFor,
      customContent
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getSocialMediaPosts: async (blogId) => {
    const response = await axios.get(`${API_BASE}/social-media/posts/${blogId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getUserSocialStats: async () => {
    const response = await axios.get(`${API_BASE}/social-media/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  refreshEngagementMetrics: async (postId) => {
    const response = await axios.post(`${API_BASE}/social-media/post/${postId}/refresh-metrics`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default socialMediaAPI;
