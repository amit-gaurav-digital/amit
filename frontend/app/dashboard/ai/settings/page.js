'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AISettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/config`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData(data);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setMessage('Settings saved successfully!');
        fetchConfig();
      } else {
        const data = await response.json();
        setMessage('Error: ' + (data.error || 'Failed to save settings'));
      }
    } catch (err) {
      setMessage('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading settings...</div>;
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <Link href="/dashboard/ai/generator">
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ← Back
              </button>
            </Link>
            <div>
              <h1 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
                AI Settings
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                Configure AI generation preferences
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* AI Generation Config */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              AI Generation Configuration
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isEnabled"
                  checked={formData.isEnabled || false}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                  Enable AI Content Generation
                </span>
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                OpenAI API Key
              </label>
              <input
                type="password"
                name="openaiApiKey"
                value={formData.openaiApiKey || ''}
                onChange={handleInputChange}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                Get your API key from openai.com
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Preferred Model
                </label>
                <select
                  name="preferredModel"
                  value={formData.preferredModel || 'gpt-3.5-turbo'}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Temperature ({formData.temperature || 0.7})
                </label>
                <input
                  type="range"
                  name="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature || 0.7}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                Max Tokens per Request
              </label>
              <input
                type="number"
                name="maxTokens"
                value={formData.maxTokens || 2000}
                onChange={handleInputChange}
                min="100"
                max="4000"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Quota Settings */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
              Monthly Quota Limits
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Monthly Token Limit
                </label>
                <input
                  type="number"
                  name="monthlyTokenLimit"
                  value={formData.monthlyTokenLimit || 100000}
                  onChange={(e) => handleNestedChange('quota', 'monthlyTokenLimit', parseInt(e.target.value))}
                  min="10000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Monthly Generation Limit
                </label>
                <input
                  type="number"
                  name="monthlyGenerationLimit"
                  value={formData.monthlyGenerationLimit || 100}
                  onChange={(e) => handleNestedChange('quota', 'monthlyGenerationLimit', parseInt(e.target.value))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                  Monthly Cost Limit (USD)
                </label>
                <input
                  type="number"
                  name="monthlyCostLimit"
                  value={formData.monthlyCostLimit || 500}
                  onChange={(e) => handleNestedChange('quota', 'monthlyCostLimit', parseFloat(e.target.value))}
                  min="10"
                  step="10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '25px' }}>
                  <input
                    type="checkbox"
                    name="enableAlerts"
                    checked={formData.enableAlerts || false}
                    onChange={handleInputChange}
                    style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                    Enable Quota Alerts
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              padding: '12px',
              backgroundColor: message.includes('Error') ? '#fee2e2' : '#dcfce7',
              color: message.includes('Error') ? '#991b1b' : '#15803d',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: saving ? '#d1d5db' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              {saving ? 'Saving...' : '✓ Save Settings'}
            </button>
            <Link href="/dashboard/ai/generator">
              <button style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
