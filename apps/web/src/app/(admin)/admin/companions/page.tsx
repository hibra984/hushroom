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
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">Pending Companions</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">
        Review applications and approve only profiles that meet trust and quality standards.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading applications...</p>
      ) : companions.length === 0 ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-[var(--ink-soft)]">
          No pending companions to review.
        </div>
      ) : (
        <div className="space-y-3">
          {companions.map((c) => (
            <div key={c.id} className="surface-card rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#153227]">{c.user?.displayName || c.user?.email}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Type: <span className="font-semibold text-[#254338]">{c.type}</span>
                    {' | '}
                    Rate: <span className="font-semibold text-[#254338]">{Number(c.baseRate).toFixed(2)} EUR/h</span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{c.bio || 'No bio provided yet.'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(c.id)}
                    className="btn-primary rounded-xl px-4 py-2 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => suspend(c.id)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
