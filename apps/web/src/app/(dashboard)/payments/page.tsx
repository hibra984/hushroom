'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Payment {
  id: string;
  amount: number;
  companionPayout: number;
  platformFee: number;
  currency: string;
  status: string;
  createdAt: string;
  session: {
    id: string;
    type: string;
    goal: { title: string } | null;
    companion: {
      user: { displayName: string | null };
    } | null;
  };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  AUTHORIZED: 'bg-yellow-100 text-yellow-800',
  CAPTURED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<Payment[]>('/payments');
        setPayments(data);
      } catch {
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--ink-soft)]">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Payment History</h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">
        Transparent pricing for every session, including payout and platform fee.
      </p>

      {payments.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <p className="text-[var(--ink-soft)]">No payments yet.</p>
          <Link href="/sessions/new" className="mt-4 inline-block text-sm font-semibold text-[#0f7a5b] hover:text-[#0a6047]">
            Book a session
          </Link>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d9e5dc] bg-[#f3f8f4]">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Companion</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#e2ece4] last:border-b-0 hover:bg-[#f8fcf9]">
                  <td className="px-4 py-3">
                    <Link href={`/sessions/${p.session.id}`} className="font-semibold text-[#0f7a5b] hover:text-[#0a6047]">
                      {p.session.goal?.title || p.session.type.replace(/_/g, ' ')}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {p.session.companion?.user.displayName || '-'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {p.currency === 'EUR' ? '\u20AC' : '$'}{Number(p.amount).toFixed(2)}
                  </td>
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
