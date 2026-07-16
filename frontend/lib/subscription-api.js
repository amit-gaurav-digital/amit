import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const subscriptionAPI = {
  getAvailablePlans: async () => {
    const response = await axios.get(`${API_BASE}/subscription/plans`);
    return response.data;
  },

  getMySubscription: async () => {
    const response = await axios.get(`${API_BASE}/subscription/my-subscription`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  upgradePlan: async (planId, billingCycle = 'monthly') => {
    const response = await axios.post(
      `${API_BASE}/subscription/upgrade`,
      { planId, billingCycle },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  downgradePlan: async (planId, billingCycle = 'monthly') => {
    const response = await axios.post(
      `${API_BASE}/subscription/downgrade`,
      { planId, billingCycle },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  cancelSubscription: async (reason = null) => {
    const response = await axios.post(
      `${API_BASE}/subscription/cancel`,
      { reason },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getUsageStats: async () => {
    const response = await axios.get(`${API_BASE}/subscription/usage`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getBillingHistory: async (limit = 20, skip = 0) => {
    const response = await axios.get(`${API_BASE}/subscription/billing-history`, {
      params: { limit, skip },
      headers: getAuthHeader()
    });
    return response.data;
  },

  checkFeatureAccess: async (feature) => {
    const response = await axios.post(
      `${API_BASE}/subscription/check-feature/${feature}`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default subscriptionAPI;
