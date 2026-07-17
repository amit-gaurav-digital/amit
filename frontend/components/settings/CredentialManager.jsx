'use client';

import { useState } from 'react';

export default function CredentialManager({
  service = 'Google',
  isConnected = false,
  propertyName = null,
  propertyId = null,
  scopes = [],
  lastRefresh = null,
  expiresAt = null,
  onRefresh = null,
  onDisconnect = null,
  onVerify = null
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setVerificationResult(null);
    } catch (error) {
      setVerificationResult({
        status: 'error',
        message: 'Failed to refresh token'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVerify = async () => {
    if (!onVerify) return;

    setIsVerifying(true);
    try {
      const result = await onVerify();
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        status: 'error',
        message: 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const isExpired = expiresAt && new Date() > new Date(expiresAt);
  const expiresIn = expiresAt
    ? Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60))
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{service} Credentials</h3>
          {isConnected && (
            <p className="text-sm text-gray-600 mt-1">
              {isExpired ? (
                <span className="text-red-600">⚠ Token expired</span>
              ) : expiresIn !== null ? (
                <span className="text-amber-600">Expires in {expiresIn} hours</span>
              ) : (
                <span>Active and secure</span>
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {/* Connection Status */}
      <div className={`rounded-lg p-4 mb-6 ${
        isConnected
          ? 'bg-green-50 border border-green-200'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}></span>
          <span className={`font-medium ${
            isConnected ? 'text-green-800' : 'text-gray-700'
          }`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && isConnected && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 text-sm">
          {propertyName && (
            <div>
              <p className="font-medium text-gray-600">Property Name</p>
              <p className="text-gray-900 mt-1 bg-white rounded px-3 py-2">
                {propertyName}
              </p>
            </div>
          )}

          {propertyId && (
            <div>
              <p className="font-medium text-gray-600">Property ID</p>
              <p className="text-gray-900 mt-1 bg-white rounded px-3 py-2 font-mono text-xs">
                {propertyId}
              </p>
            </div>
          )}

          {scopes.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {scopes.map((scope, idx) => {
                  const scopeName = scope.split('/').pop();
                  return (
                    <span
                      key={idx}
                      className="bg-white border border-gray-300 rounded-full text-xs px-3 py-1 text-gray-700"
                    >
                      {scopeName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {lastRefresh && (
            <div>
              <p className="font-medium text-gray-600">Last Refreshed</p>
              <p className="text-gray-900 mt-1">
                {new Date(lastRefresh).toLocaleString()}
              </p>
            </div>
          )}

          {expiresAt && (
            <div>
              <p className="font-medium text-gray-600">Expires At</p>
              <p className={`mt-1 ${isExpired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {new Date(expiresAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div className={`rounded-lg p-4 mb-6 ${
          verificationResult.status === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-medium">
            {verificationResult.status === 'success' ? '✓ Verified' : '✕ Verification Failed'}
          </p>
          <p className="text-sm mt-1">{verificationResult.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {isConnected && (
          <>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              {isVerifying ? '⟳ Verifying...' : '✓ Verify'}
            </button>

            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                {isRefreshing ? '⟳ Refreshing...' : '🔄 Refresh Token'}
              </button>
            )}

            {onDisconnect && (
              <button
                onClick={() => {
                  if (window.confirm('Disconnect this credential?')) {
                    onDisconnect();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                🔓 Disconnect
              </button>
            )}
          </>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          🔒 All credentials are encrypted and never displayed in plain text. Only authorized operations can access your data.
        </p>
      </div>
    </div>
  );
}
