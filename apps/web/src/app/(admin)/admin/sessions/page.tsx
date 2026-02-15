'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface AdminSession {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  goal: { title: string } | null;
  user: { displayName: string | null; email: string } | null;
  companion: { user: { displayName: string | null } | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_MATCH: 'bg-[#fff4dd] text-[#8c6421]',
  MATCHED: 'bg-[#eaf4ff] text-[#1d5d89]',
  PAYMENT_AUTHORIZED: 'bg-[#f2efff] text-[#5a5096]',
  READY: 'bg-[#dff6ed] text-[#0f7054]',
  IN_PROGRESS: 'bg-[#dff6ed] text-[#0f7054]',
  PAUSED: 'bg-[#fff4dd] text-[#8c6421]',
  COMPLETED: 'bg-[#edf3ef] text-[#556b61]',
  CANCELLED: 'bg-[#ffe9e7] text-[#a03a2a]',
  ABANDONED: 'bg-[#ffe9e7] text-[#a03a2a]',
  DISPUTED: 'bg-[#ffe9e7] text-[#a03a2a]',
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ sessions: AdminSession[]; total: number }>(`/admin/sessions?page=${page}&limit=20`)
      .then((data) => { setSessions(data.sessions); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">Sessions</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">{total} session(s) in platform history.</p>

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading sessions...</p>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d9e5dc] bg-[#f3f8f4] text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Companion</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-[#e2ece4] last:border-b-0 hover:bg-[#f8fcf9]">
                  <td className="px-4 py-3">{s.goal?.title || '-'}</td>
                  <td className="px-4 py-3">{s.user?.displayName || s.user?.email || '-'}</td>
                  <td className="px-4 py-3">{s.companion?.user?.displayName || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_STYLES[s.status] || 'bg-[#edf3ef] text-[#556b61]'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.type}</td>
                  <td className="px-4 py-3">{new Date(s.createdAt).toLocaleDateString()}</td>
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
          disabled={sessions.length < 20}
          className="btn-secondary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
