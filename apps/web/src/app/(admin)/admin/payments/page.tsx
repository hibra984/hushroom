'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface AdminPayment {
  id: string;
  amount: string | number;
  platformFee: string | number;
  status: string;
  createdAt: string;
  sessionId: string;
  session: {
    goal: { title: string } | null;
  } | null;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  AUTHORIZED: 'bg-[#fff4dd] text-[#8c6421]',
  CAPTURED: 'bg-[#dff6ed] text-[#0f7054]',
  REFUNDED: 'bg-[#ffe9e7] text-[#a03a2a]',
  FAILED: 'bg-[#ffe9e7] text-[#a03a2a]',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ payments: AdminPayment[]; total: number }>(`/admin/payments?page=${page}&limit=20`)
      .then((data) => { setPayments(data.payments); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">Payments</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">{total} payment record(s) captured.</p>

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading payments...</p>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d9e5dc] bg-[#f3f8f4] text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Platform Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#e2ece4] last:border-b-0 hover:bg-[#f8fcf9]">
                  <td className="px-4 py-3">{p.session?.goal?.title || p.sessionId}</td>
                  <td className="px-4 py-3">{Number(p.amount).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">{Number(p.platformFee).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        PAYMENT_STATUS_STYLES[p.status] || 'bg-[#edf3ef] text-[#556b61]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="btn-secondary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1 text-sm text-[var(--ink-soft)]">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={payments.length < 20}
          className="btn-secondary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
