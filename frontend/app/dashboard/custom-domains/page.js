'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Copy, Check, AlertCircle, CheckCircle, Clock, Trash2, Star } from 'lucide-react';
import customDomainAPI from '@/lib/customDomain-api';

export default function CustomDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showVerificationGuide, setShowVerificationGuide] = useState(false);
  const [copiedText, setCopiedText] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [newDomain, setNewDomain] = useState({
    domain: '',
    subdomain: ''
  });

  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (filterStatus !== null) {
      loadDomains(filterStatus);
    }
  }, [filterStatus]);

  const loadDomains = async (status = null) => {
    setLoading(true);
    try {
      const domainsData = await customDomainAPI.getDomains(status);
      setDomains(domainsData);
      setError('');
    } catch (err) {
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.domain) {
      setError('Domain is required');
      return;
    }

    try {
      await customDomainAPI.validateDomain(newDomain.domain);
      const result = await customDomainAPI.addDomain(newDomain.domain, newDomain.subdomain);

      setSuccessMessage('Domain added! Follow the DNS verification instructions.');
      setShowAddModal(false);
      setNewDomain({ domain: '', subdomain: '' });
      setSelectedDomain(result);
      setShowVerificationGuide(true);
      await loadDomains(filterStatus);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add domain');
    }
  };

  const handleVerifyDomain = async (domainId) => {
    setVerifying(true);
    try {
      const result = await customDomainAPI.verifyDomain(domainId);

      if (result.verified) {
        setSuccessMessage('Domain verified successfully! SSL certificate is being set up.');
      } else {
        setError(result.reason || 'Verification failed. Please check your DNS records.');
      }

      await loadDomains(filterStatus);
    } catch (err) {
      setError('Failed to verify domain');
    } finally {
      setVerifying(false);
    }
  };

  const handleSetPrimary = async (domainId) => {
    try {
      await customDomainAPI.updateDomain(domainId, { isPrimary: true });
      setSuccessMessage('Primary domain updated');
      await loadDomains(filterStatus);
    } catch (err) {
      setError('Failed to set primary domain');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (confirm('Delete this domain? This action cannot be undone.')) {
      try {
        await customDomainAPI.deleteDomain(domainId);
        setSuccessMessage('Domain deleted');
        await loadDomains(filterStatus);
      } catch (err) {
        setError('Failed to delete domain');
      }
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'verified':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>;
      case 'verifying':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Verifying</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Custom Domains</h1>
        <p className="text-gray-600 mt-2">Set up and manage custom domains for your blogs with automatic SSL certificates</p>
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

      {/* Info Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-blue-900 font-semibold">Total Domains</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{domains.length}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-green-900 font-semibold">Active Domains</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{domains.filter(d => d.status === 'active').length}</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-purple-900 font-semibold">Pending Verification</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{domains.filter(d => d.status === 'pending' || d.status === 'verifying').length}</div>
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Your Domains</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Pending
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading domains...</div>
        ) : domains.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No custom domains yet</p>
            <p className="text-sm mt-1">Add your first custom domain to get started</p>
          </div>
        ) : (
          <div className="divide-y">
            {domains.map(domain => (
              <div key={domain._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{domain.fullDomain}</h3>
                      {domain.isPrimary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Primary domain" />
                      )}
                    </div>
                    {getStatusBadge(domain.status)}
                  </div>

                  <div className="flex gap-2">
                    {domain.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedDomain(domain);
                          setShowVerificationGuide(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Show DNS Records
                      </button>
                    )}

                    {domain.status === 'verified' && (
                      <button
                        onClick={() => handleVerifyDomain(domain._id)}
                        disabled={verifying}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                      >
                        {verifying ? 'Verifying...' : 'Verify'}
                      </button>
                    )}

                    {domain.status === 'active' && !domain.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(domain._id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Set as Primary
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDomain(domain._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created</span>
                    <div className="font-medium text-gray-900 mt-1">{new Date(domain.createdAt).toLocaleDateString()}</div>
                  </div>

                  {domain.sslCertificate && domain.sslCertificate.expiresAt && (
                    <div>
                      <span className="text-gray-600">SSL Expires</span>
                      <div className="font-medium text-gray-900 mt-1">{new Date(domain.sslCertificate.expiresAt).toLocaleDateString()}</div>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-600">Verification Method</span>
                    <div className="font-medium text-gray-900 mt-1 uppercase">{domain.verificationMethod}</div>
                  </div>

                  <div>
                    <span className="text-gray-600">Views</span>
                    <div className="font-medium text-gray-900 mt-1">{domain.viewCount}</div>
                  </div>
                </div>

                {domain.status === 'failed' && domain.verificationFailureReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {domain.verificationFailureReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Add Custom Domain</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Domain Name *</label>
                <input
                  type="text"
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Your domain name without www or https://</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Subdomain (Optional)</label>
                <input
                  type="text"
                  value={newDomain.subdomain}
                  onChange={(e) => setNewDomain({ ...newDomain, subdomain: e.target.value })}
                  placeholder="blog"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Leave empty to use root domain</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddDomain}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Domain
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDomain({ domain: '', subdomain: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Guide Modal */}
      {showVerificationGuide && selectedDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-6">Verify Your Domain</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 text-sm">
                <strong>Domain:</strong> {selectedDomain.fullDomain}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Verification Method: {selectedDomain.verificationMethod.toUpperCase()}</h3>

                {selectedDomain.verificationMethod === 'cname' && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">Add the following CNAME record to your domain DNS settings:</p>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        <div>
                          <div className="text-gray-600 text-xs font-semibold mb-1">Name/Host</div>
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300">{selectedDomain.fullDomain}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs font-semibold mb-1">Type</div>
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300">CNAME</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-gray-600 text-xs font-semibold mb-1">Value/Points To</div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300 flex-1 font-mono text-sm">
                            {selectedDomain.dnsRecords.cname}
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedDomain.dnsRecords.cname, 'cname')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            {copiedText === 'cname' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDomain.verificationMethod === 'txt' && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">Add the following TXT record to your domain DNS settings:</p>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        <div>
                          <div className="text-gray-600 text-xs font-semibold mb-1">Name/Host</div>
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300">{selectedDomain.fullDomain}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs font-semibold mb-1">Type</div>
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300">TXT</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-gray-600 text-xs font-semibold mb-1">Value</div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-900 bg-white p-2 rounded border border-gray-300 flex-1 font-mono text-sm">
                            {selectedDomain.dnsRecords.txt}
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedDomain.dnsRecords.txt, 'txt')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            {copiedText === 'txt' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-900 text-sm">
                  <strong>Important:</strong> DNS changes can take 24-48 hours to propagate. You can try verifying sooner, but it may fail if the records haven't propagated yet.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleVerifyDomain(selectedDomain._id)}
                disabled={verifying}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify DNS Records'}
              </button>
              <button
                onClick={() => {
                  setShowVerificationGuide(false);
                  setSelectedDomain(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
