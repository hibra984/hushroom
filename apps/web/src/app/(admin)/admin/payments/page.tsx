'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ payments: any[]; total: number }>(`/admin/payments?page=${page}&limit=20`)
      .then((data) => { setPayments(data.payments); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Payments ({total})</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-gray-400">
            <tr>
              <th className="py-2">Session</th>
              <th>Amount</th>
              <th>Platform Fee</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-800">
                <td className="py-2">{p.session?.goal?.title || p.sessionId}</td>
                <td>\u20AC{Number(p.amount).toFixed(2)}</td>
                <td>\u20AC{Number(p.platformFee).toFixed(2)}</td>
                <td>
                  <span className={`rounded px-2 py-0.5 text-xs ${p.status === 'CAPTURED' ? 'bg-green-800' : p.status === 'FAILED' ? 'bg-red-800' : 'bg-gray-700'}`}>
                    {p.status}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Prev</button>
        <span className="px-2 py-1 text-sm text-gray-400">Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={payments.length < 20} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
