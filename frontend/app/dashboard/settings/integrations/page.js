'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function IntegrationsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      // Redirect to Google Analytics page with the OAuth code
      router.push(`/dashboard/settings/integrations/google-analytics?code=${code}&state=${state || ''}`);
    } else {
      // If no code, just show available integrations
      router.push('/dashboard/settings');
    }
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p style={{ color: '#666', fontSize: '16px' }}>Processing integration...</p>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
      <IntegrationsRedirectContent />
    </Suspense>
  );
}
