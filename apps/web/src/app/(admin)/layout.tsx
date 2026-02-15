'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

const NAV_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/companions', label: 'Companions' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card rounded-2xl px-6 py-4 text-sm text-[var(--ink-soft)]">
          Loading admin workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-8 pt-4 sm:px-6">
      <nav className="glass-shell mx-auto max-w-7xl rounded-2xl px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <img src="/hushroom-mark.svg" alt="Hushroom" className="h-8 w-8" />
              <span>Hushroom</span>
              <span className="rounded-full bg-[#fff4dc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8c6421]">
                Admin
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 lg:hidden"
            >
              Sign Out
            </button>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    isActive
                      ? 'bg-[#0f7e5f] text-white'
                      : 'bg-white/70 text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/dashboard" className="btn-secondary rounded-full px-3 py-1 text-xs font-semibold">
              Back to App
            </Link>
            <span className="text-sm text-[var(--ink-soft)]">
              {user?.displayName || user?.firstName || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
          <Link
            href="/dashboard"
            className="btn-secondary inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold lg:hidden"
          >
            Back to App
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl pt-5">
        <div className="surface-card rounded-3xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
