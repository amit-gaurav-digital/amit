'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function IntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/dashboard/settings/integrations/google-analytics?error=${error}`);
    } else if (code) {
      router.push(`/dashboard/settings/integrations/google-analytics?code=${code}&state=${state}`);
    } else {
      router.push('/dashboard/settings/integrations/google-analytics');
    }
  }, [router, searchParams]);

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <p>Processing OAuth connection...</p>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
