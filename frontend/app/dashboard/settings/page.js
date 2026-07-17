'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('integrations');

  const tabs = [
    { id: 'integrations', label: '🔗 Integrations', icon: '🔗' },
    { id: 'preferences', label: '⚙️ Preferences', icon: '⚙️' },
    { id: 'account', label: '👤 Account', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your integrations and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 border-b">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'integrations' && (
            <IntegrationsContent />
          )}
          {activeTab === 'preferences' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Preferences coming soon</p>
            </div>
          )}
          {activeTab === 'account' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Account settings coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationsContent() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-600">Connect your blogs to Google Analytics and Search Console</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Analytics Card */}
        <Link href="/dashboard/settings/integrations/google-analytics">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow border border-blue-200">
            <div className="flex items-center mb-4">
              <img src="/google-analytics-icon.png" alt="GA" className="w-10 h-10 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Google Analytics</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Connect your Google Analytics property to see real-time visitor data, page views, and user behavior.
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>Manage →</span>
            </div>
          </div>
        </Link>

        {/* Search Console Card */}
        <Link href="/dashboard/settings/integrations/search-console">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow border border-green-200">
            <div className="flex items-center mb-4">
              <img src="/search-console-icon.png" alt="SC" className="w-10 h-10 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Search Console</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Connect Google Search Console to track search performance, keywords, and SEO metrics.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>Manage →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Integration Status Overview */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Integration Status</h3>
        <p className="text-gray-600 text-sm mb-4">
          Your integration status and sync information will appear here. Click on a service to configure.
        </p>
      </div>
    </div>
  );
}
