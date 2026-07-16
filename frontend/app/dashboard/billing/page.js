'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import subscriptionAPI from '@/lib/subscription-api';

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subData, usageData, historyData] = await Promise.all([
        subscriptionAPI.getAvailablePlans(),
        subscriptionAPI.getMySubscription(),
        subscriptionAPI.getUsageStats(),
        subscriptionAPI.getBillingHistory(20, 0)
      ]);

      setPlans(plansData);
      setCurrentSubscription(subData);
      setUsageStats(usageData);
      setBillingHistory(historyData.history);
      setError('');
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId) => {
    if (currentSubscription && currentSubscription.planId._id === planId) {
      return;
    }

    try {
      const currentTier = currentSubscription.planId.tier;
      const newPlan = plans.find(p => p._id === planId);

      if (newPlan.tier > currentTier) {
        await subscriptionAPI.upgradePlan(planId, 'monthly');
        setSuccessMessage('Plan upgraded successfully!');
      } else {
        await subscriptionAPI.downgradePlan(planId, 'monthly');
        setSuccessMessage('Plan downgraded successfully!');
      }

      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change plan');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await subscriptionAPI.cancelSubscription(cancelReason);
      setSuccessMessage('Subscription canceled successfully');
      setShowCancelConfirm(false);
      setCancelReason('');
      await loadData();
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    return Math.round((used / limit) * 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription plan, billing, and usage</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded border bg-red-50 border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded border bg-green-50 border-green-200 text-green-700 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Current Plan */}
      {currentSubscription && (
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm opacity-90">Current Plan</div>
              <h2 className="text-4xl font-bold mt-2">{currentSubscription.planId.name}</h2>
              <p className="mt-2 opacity-90">{currentSubscription.planId.description}</p>

              <div className="mt-6 flex items-center gap-6">
                <div>
                  <div className="text-sm opacity-90">Status</div>
                  <div className="font-semibold mt-1 capitalize">{currentSubscription.status}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Billing Cycle</div>
                  <div className="font-semibold mt-1 capitalize">{currentSubscription.billingCycle}</div>
                </div>
                {currentSubscription.currentPeriodEnd && (
                  <div>
                    <div className="text-sm opacity-90">Renews</div>
                    <div className="font-semibold mt-1">{formatDate(currentSubscription.currentPeriodEnd)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-5xl font-bold">
                ${currentSubscription.planId.pricing.monthlyPrice}
              </div>
              <div className="text-sm opacity-90 mt-2">/month</div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usageStats && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Resource Usage</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(usageStats.usage).map(([key, value]) => {
              const limit = usageStats.limits[key];
              const percentage = getUsagePercentage(value, limit);
              const isUnlimited = limit === -1;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {isUnlimited ? 'Unlimited' : `${value} / ${limit}`}
                      </div>
                    </div>
                    {!isUnlimited && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
                      </div>
                    )}
                  </div>

                  {!isUnlimited && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 80 ? 'bg-red-600' : percentage > 50 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Plans */}
      {!loading && plans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan._id}
                className={`rounded-lg border-2 transition-all ${
                  currentSubscription?.planId._id === plan._id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>

                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900">
                      ${plan.pricing.monthlyPrice}
                    </div>
                    <div className="text-sm text-gray-600">/month</div>
                  </div>

                  <button
                    onClick={() => handlePlanChange(plan._id)}
                    disabled={currentSubscription?.planId._id === plan._id}
                    className={`w-full mt-6 py-2 rounded-lg font-medium transition ${
                      currentSubscription?.planId._id === plan._id
                        ? 'bg-blue-600 text-white cursor-default'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {currentSubscription?.planId._id === plan._id ? 'Current Plan' : 'Switch to ' + plan.name}
                  </button>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">{feature.name}</div>
                          {!feature.unlimited && feature.limit > 0 && (
                            <div className="text-sm text-gray-600">{feature.limit} per month</div>
                          )}
                          {feature.unlimited && (
                            <div className="text-sm text-gray-600">Unlimited</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {plan.support !== 'none' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {plan.support} Support Included
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billingHistory.map(invoice => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{formatDate(invoice.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{invoice.description}</div>
                      <div className="text-xs text-gray-600">{invoice.planName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Subscription */}
      {currentSubscription && currentSubscription.planId.slug !== 'free' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Cancel Your Subscription</h3>
              <p className="text-gray-600 text-sm mt-1">
                If you're no longer happy with your plan, you can cancel anytime. Your plan will remain active until the end of the billing period.
              </p>

              {!showCancelConfirm && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  Cancel Subscription
                </button>
              )}

              {showCancelConfirm && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us why you're canceling (optional)"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                    rows="3"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelConfirm(false);
                        setCancelReason('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm"
                    >
                      Keep Subscription
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
