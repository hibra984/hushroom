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
    return <div className="p-8 text-center text-[var(--ink-soft)]">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-2 sm:p-4">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Understand your payout flow and recent transaction performance.
          </p>
        </div>
        <button
          onClick={handleOnboard}
          className="btn-primary rounded-xl px-4 py-2 text-sm"
        >
          Stripe Setup
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="surface-card rounded-2xl p-6">
          <p className="text-sm text-[var(--ink-soft)]">Total Earnings</p>
          <p className="mt-1 text-3xl font-bold text-[#0f7a5b]">
            ${Number(earnings?.totalEarnings ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-6">
          <p className="text-sm text-[var(--ink-soft)]">Pending Payouts</p>
          <p className="mt-1 text-3xl font-bold text-[#c68716]">
            ${Number(earnings?.pendingPayouts ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-6">
          <p className="text-sm text-[var(--ink-soft)]">Completed Sessions</p>
          <p className="mt-1 text-3xl font-bold">{Number(earnings?.completedPayouts ?? 0)}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Recent Payments</h2>
      {!earnings?.recentPayments.length ? (
        <p className="text-[var(--ink-soft)]">No payments yet.</p>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d9e5dc] bg-[#f3f8f4]">
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
                <tr key={p.id} className="border-b border-[#e2ece4] last:border-b-0 hover:bg-[#f8fcf9]">
                  <td className="px-4 py-3">{p.session?.goal?.title || 'Untitled'}</td>
                  <td className="px-4 py-3">{p.session?.user?.displayName || '-'}</td>
                  <td className="px-4 py-3">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium">${Number(p.companionPayout).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLES[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
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
