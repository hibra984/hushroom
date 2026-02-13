'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Earnings {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  recentPayments: {
    id: string;
    amount: number;
    companionPayout: number;
    platformFee: number;
    status: string;
    createdAt: string;
    session: {
      goal: { title: string } | null;
      user: { displayName: string | null } | null;
    };
  }[];
}

const STATUS_STYLES: Record<string, string> = {
  AUTHORIZED: 'bg-yellow-100 text-yellow-800',
  CAPTURED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-red-100 text-red-800',
  FAILED: 'bg-gray-100 text-gray-800',
};

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<Earnings>('/payments/companion/earnings');
        setEarnings(data);
      } catch {
        setEarnings(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleOnboard = async () => {
    try {
      const { url } = await apiClient.post<{ url: string }>('/payments/companion/onboard');
      window.location.href = url;
    } catch {
      // Handle error
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <button
          onClick={handleOnboard}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Stripe Setup
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="mt-1 text-3xl font-bold text-green-600">
            ${earnings?.totalEarnings.toFixed(2) ?? '0.00'}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Pending Payouts</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600">
            ${earnings?.pendingPayouts.toFixed(2) ?? '0.00'}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Completed Sessions</p>
          <p className="mt-1 text-3xl font-bold">{earnings?.completedPayouts ?? 0}</p>
        </div>
      </div>

      {/* Recent Payments */}
      <h2 className="mb-4 text-lg font-semibold">Recent Payments</h2>
      {!earnings?.recentPayments.length ? (
        <p className="text-gray-500">No payments yet.</p>
      ) : (
        <div className="rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Your Payout</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.recentPayments.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{p.session?.goal?.title || 'Untitled'}</td>
                  <td className="px-4 py-3">{p.session?.user?.displayName || '-'}</td>
                  <td className="px-4 py-3">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium">${Number(p.companionPayout).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
