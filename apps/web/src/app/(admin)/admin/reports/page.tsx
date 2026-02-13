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
    <div>
      <h1 className="mb-4 text-2xl font-bold">Abuse Reports</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400">No pending reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-red-400">{r.reason}</span>
                <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="mb-2 text-sm text-gray-300">{r.description}</p>
              <p className="mb-2 text-xs text-gray-500">
                Reporter: {r.reporterId} | Reported: {r.reportedUserId}
              </p>
              <input
                type="text"
                placeholder="Admin notes..."
                value={notes[r.id] || ''}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                className="mb-2 w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
              />
              <div className="flex gap-2">
                <button onClick={() => resolve(r.id)} className="rounded bg-green-700 px-3 py-1 text-sm hover:bg-green-600">Resolve</button>
                <button onClick={() => dismiss(r.id)} className="rounded bg-gray-600 px-3 py-1 text-sm hover:bg-gray-500">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
