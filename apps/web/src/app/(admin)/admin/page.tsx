'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformStats {
  totalUsers: number;
  totalCompanions: number;
  totalSessions: number;
  completedSessions: number;
  totalPayments: number;
  totalRevenue: number;
  pendingReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<PlatformStats>('/admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading stats...</p>;
  if (!stats) return <p className="text-red-400">Failed to load stats</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-600' },
    { label: 'Approved Companions', value: stats.totalCompanions, color: 'bg-green-600' },
    { label: 'Total Sessions', value: stats.totalSessions, color: 'bg-purple-600' },
    { label: 'Completed Sessions', value: stats.completedSessions, color: 'bg-indigo-600' },
    { label: 'Captured Payments', value: stats.totalPayments, color: 'bg-yellow-600' },
    { label: 'Platform Revenue', value: `\u20AC${stats.totalRevenue.toFixed(2)}`, color: 'bg-emerald-600' },
    { label: 'Pending Reports', value: stats.pendingReports, color: stats.pendingReports > 0 ? 'bg-red-600' : 'bg-gray-600' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Platform Overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.color} rounded-lg p-4`}>
            <p className="text-sm text-white/80">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
