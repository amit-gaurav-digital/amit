import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const translationAPI = {
  getAvailableLanguages: async () => {
    const response = await axios.get(`${API_BASE}/translation/languages`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  translateBlog: async (blogId, language) => {
    const response = await axios.post(`${API_BASE}/translation/translate/${blogId}`, {
      language
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  bulkTranslate: async (blogId, languages) => {
    const response = await axios.post(`${API_BASE}/translation/translate-bulk/${blogId}`, {
      languages
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getTranslations: async (blogId) => {
    const response = await axios.get(`${API_BASE}/translation/translations/${blogId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getTranslationByLanguage: async (blogId, language) => {
    const response = await axios.get(`${API_BASE}/translation/translation/${blogId}/${language}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getLanguageStats: async (blogId) => {
    const response = await axios.get(`${API_BASE}/translation/stats/${blogId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  reviewTranslation: async (translationId) => {
    const response = await axios.put(`${API_BASE}/translation/translation/${translationId}/review`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  publishTranslation: async (translationId) => {
    const response = await axios.post(`${API_BASE}/translation/translation/${translationId}/publish`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deleteTranslation: async (translationId) => {
    const response = await axios.delete(`${API_BASE}/translation/translation/${translationId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateTranslation: async (translationId, data) => {
    const response = await axios.put(`${API_BASE}/translation/translation/${translationId}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default translationAPI;
