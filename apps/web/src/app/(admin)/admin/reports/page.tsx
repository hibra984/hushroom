'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface AbuseReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ reports: AbuseReport[] }>('/admin/reports?status=PENDING');
      setReports(data.reports);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const resolve = async (id: string) => {
    await apiClient.post(`/admin/reports/${id}/resolve`, { adminNotes: notes[id] || 'Resolved' });
    fetchReports();
  };

  const dismiss = async (id: string) => {
    await apiClient.post(`/admin/reports/${id}/dismiss`, { adminNotes: notes[id] || 'Dismissed' });
    fetchReports();
  };

  return (
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">Abuse Reports</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">
        Investigate pending trust incidents and document every moderation decision.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="surface-card rounded-2xl p-6 text-sm text-[var(--ink-soft)]">
          No pending reports.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="surface-card rounded-2xl p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-[#ffe9e7] px-2 py-0.5 text-xs font-semibold text-[#a03a2a]">
                  {r.reason}
                </span>
                <span className="text-xs text-[var(--ink-soft)]">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="mb-2 text-sm text-[var(--ink)]">{r.description}</p>
              <p className="mb-2 text-xs text-[var(--ink-soft)]">
                Reporter: {r.reporterId} | Reported: {r.reportedUserId}
              </p>
              <textarea
                placeholder="Admin notes..."
                value={notes[r.id] || ''}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                rows={2}
                className="input-field mb-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => resolve(r.id)}
                  className="btn-primary rounded-xl px-4 py-2 text-sm"
                >
                  Resolve
                </button>
                <button
                  onClick={() => dismiss(r.id)}
                  className="btn-secondary rounded-xl px-4 py-2 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
