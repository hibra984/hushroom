'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PendingCompanion {
  id: string;
  type: string;
  baseRate: string;
  bio: string | null;
  user: { displayName: string | null; email: string };
}

export default function AdminCompanionsPage() {
  const [companions, setCompanions] = useState<PendingCompanion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<PendingCompanion[]>('/admin/companions/pending');
      setCompanions(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id: string) => {
    await apiClient.post(`/admin/companions/${id}/approve`);
    fetchPending();
  };

  const suspend = async (id: string) => {
    await apiClient.post(`/admin/companions/${id}/suspend`);
    fetchPending();
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Pending Companions</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : companions.length === 0 ? (
        <p className="text-gray-400">No pending companions to review.</p>
      ) : (
        <div className="space-y-3">
          {companions.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div>
                <p className="font-medium">{c.user?.displayName || c.user?.email}</p>
                <p className="text-sm text-gray-400">Type: {c.type} | Rate: \u20AC{Number(c.baseRate).toFixed(2)}/h</p>
                <p className="text-sm text-gray-500">{c.bio || 'No bio'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(c.id)} className="rounded bg-green-700 px-3 py-1 text-sm hover:bg-green-600">Approve</button>
                <button onClick={() => suspend(c.id)} className="rounded bg-red-700 px-3 py-1 text-sm hover:bg-red-600">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
