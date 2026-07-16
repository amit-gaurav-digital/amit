import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const analyticsAPI = {
  recordPageView: async (blogId, source = 'direct', device = 'desktop', country = 'unknown') => {
    try {
      await axios.post(`${API_BASE}/analytics/page-view/${blogId}`, {
        source,
        device,
        country
      }, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error('Failed to record page view:', error);
    }
  },

  getDashboardSummary: async (days = 30) => {
    const response = await axios.get(`${API_BASE}/analytics/dashboard?days=${days}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getBlogAnalytics: async (blogId, startDate, endDate) => {
    const response = await axios.get(
      `${API_BASE}/analytics/blog/${blogId}?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getTopPerformingBlogs: async (limit = 10, days = 30) => {
    const response = await axios.get(
      `${API_BASE}/analytics/top-performing?limit=${limit}&days=${days}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getTopReferrers: async (blogId, startDate, endDate) => {
    const response = await axios.get(
      `${API_BASE}/analytics/blog/${blogId}/referrers?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getGeographicData: async (blogId, startDate, endDate) => {
    const response = await axios.get(
      `${API_BASE}/analytics/blog/${blogId}/geography?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getSearchTermsPerformance: async (blogId, startDate, endDate) => {
    const response = await axios.get(
      `${API_BASE}/analytics/blog/${blogId}/search-terms?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getGrowthMetrics: async (blogId, days = 30) => {
    const response = await axios.get(
      `${API_BASE}/analytics/blog/${blogId}/growth?days=${days}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  compareBlogs: async (blogIds, startDate, endDate) => {
    const response = await axios.post(`${API_BASE}/analytics/compare`, {
      blogIds,
      startDate,
      endDate
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  exportAnalytics: async (blogId, startDate, endDate) => {
    const response = await axios.get(
      `${API_BASE}/analytics/export/${blogId}?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: getAuthHeader(),
        responseType: 'blob'
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${blogId}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default analyticsAPI;
