'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading platform stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">Failed to load stats</p>
      </div>
    );
  }

  const revenue = Number(stats.totalRevenue ?? 0);

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      tone: 'bg-[#eaf4ff] text-[#1d5d89]',
    },
    {
      label: 'Approved Companions',
      value: stats.totalCompanions,
      tone: 'bg-[#e6f7ef] text-[#0f6d53]',
    },
    {
      label: 'Total Sessions',
      value: stats.totalSessions,
      tone: 'bg-[#f2efff] text-[#5a5096]',
    },
    {
      label: 'Completed Sessions',
      value: stats.completedSessions,
      tone: 'bg-[#edf5f0] text-[#466659]',
    },
    {
      label: 'Captured Payments',
      value: stats.totalPayments,
      tone: 'bg-[#fff4dd] text-[#8c6421]',
    },
    {
      label: 'Platform Revenue',
      value: `${revenue.toFixed(2)} EUR`,
      tone: 'bg-[#e6f7ef] text-[#0f6d53]',
    },
    {
      label: 'Pending Reports',
      value: stats.pendingReports,
      tone: stats.pendingReports > 0 ? 'bg-[#ffe9e7] text-[#a03a2a]' : 'bg-[#edf3ef] text-[#556b61]',
    },
  ];

  return (
    <div className="py-2 sm:py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Track ecosystem health, moderation load, and revenue performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`surface-card rounded-2xl p-4 ${c.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/users" className="surface-card card-lift rounded-2xl p-4">
            <p className="font-semibold">User Management</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Search, verify, and activate accounts.</p>
          </Link>
          <Link href="/admin/companions" className="surface-card card-lift rounded-2xl p-4">
            <p className="font-semibold">Companion Moderation</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Review pending companion applications.</p>
          </Link>
          <Link href="/admin/reports" className="surface-card card-lift rounded-2xl p-4">
            <p className="font-semibold">Safety Reports</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Resolve abuse reports and document outcomes.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
