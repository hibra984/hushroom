'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ sessions: any[]; total: number }>(`/admin/sessions?page=${page}&limit=20`)
      .then((data) => { setSessions(data.sessions); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Sessions ({total})</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-gray-400">
            <tr>
              <th className="py-2">Goal</th>
              <th>User</th>
              <th>Companion</th>
              <th>Status</th>
              <th>Type</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="py-2">{s.goal?.title || '\u2014'}</td>
                <td>{s.user?.displayName || s.user?.email || '\u2014'}</td>
                <td>{s.companion?.user?.displayName || '\u2014'}</td>
                <td><span className="rounded bg-gray-700 px-2 py-0.5 text-xs">{s.status}</span></td>
                <td>{s.type}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Prev</button>
        <span className="px-2 py-1 text-sm text-gray-400">Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={sessions.length < 20} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
