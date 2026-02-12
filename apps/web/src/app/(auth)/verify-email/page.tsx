'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api-client';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    searchParams.then((params) => {
      const token = params.token;
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      apiClient
        .post('/auth/verify-email', { token })
        .then(() => setStatus('success'))
        .catch((err) => {
          setStatus('error');
          setError(err instanceof ApiClientError ? err.message : 'Verification failed');
        });
    });
  }, [searchParams]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
      {status === 'verifying' && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Verifying Email</h2>
          <p className="text-sm text-gray-500">Please wait while we verify your email address...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 className="mb-4 text-xl font-semibold text-green-700">Email Verified</h2>
          <p className="mb-6 text-sm text-gray-600">
            Your email has been verified successfully. You can now access all features.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 className="mb-4 text-xl font-semibold text-red-700">Verification Failed</h2>
          <p className="mb-6 text-sm text-gray-600">{error}</p>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  );
}
