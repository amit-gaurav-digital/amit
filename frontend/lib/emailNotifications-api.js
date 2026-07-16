import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const emailNotificationsAPI = {
  getNotificationPreferences: async () => {
    const response = await axios.get(`${API_BASE}/email-notifications/preferences`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateNotificationPreference: async (notificationType, frequency, isEnabled = true) => {
    const response = await axios.put(
      `${API_BASE}/email-notifications/preferences/${notificationType}`,
      { frequency, isEnabled },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getEmailLogs: async (limit = 20, skip = 0) => {
    const response = await axios.get(`${API_BASE}/email-notifications/logs`, {
      params: { limit, skip },
      headers: getAuthHeader()
    });
    return response.data;
  },

  resendFailedEmails: async () => {
    const response = await axios.post(`${API_BASE}/email-notifications/resend-failed`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  sendTestEmail: async (email, subject) => {
    const response = await axios.post(
      `${API_BASE}/email-notifications/test`,
      { email, subject },
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default emailNotificationsAPI;
