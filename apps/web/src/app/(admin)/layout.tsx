'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="border-b border-gray-700 bg-gray-800">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/admin" className="text-lg font-bold text-white">
            Hushroom Admin
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
            <Link href="/admin/users" className="text-sm text-gray-300 hover:text-white">Users</Link>
            <Link href="/admin/companions" className="text-sm text-gray-300 hover:text-white">Companions</Link>
            <Link href="/admin/sessions" className="text-sm text-gray-300 hover:text-white">Sessions</Link>
            <Link href="/admin/payments" className="text-sm text-gray-300 hover:text-white">Payments</Link>
            <Link href="/admin/reports" className="text-sm text-gray-300 hover:text-white">Reports</Link>
            <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">Exit Admin</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
