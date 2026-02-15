'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">
        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
        This is your command center for sessions, contracts, and accountability progress.
      </p>

      {user && !user.isEmailVerified && (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Your email is not verified. Please check your inbox for a verification link.
        </div>
      )}

      {user && !user.isAgeVerified && (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Age verification is required to book sessions.
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="surface-card card-lift rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Book a Session</h3>
          <p className="mb-5 mt-2 text-sm text-[var(--ink-soft)]">
            Start a new goal-bound presence session with a companion.
          </p>
          <Link
            href="/sessions/new"
            className="btn-primary inline-flex px-4 py-2 text-sm"
          >
            New Session
          </Link>
        </div>

        <div className="surface-card card-lift rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Session History</h3>
          <p className="mb-5 mt-2 text-sm text-[var(--ink-soft)]">
            View your past sessions, ratings, and outcomes.
          </p>
          <Link
            href="/sessions"
            className="btn-secondary inline-flex px-4 py-2 text-sm"
          >
            View Sessions
          </Link>
        </div>

        <div className="surface-card card-lift rounded-2xl p-6">
          <h3 className="text-lg font-semibold">Your Profile</h3>
          <p className="mb-5 mt-2 text-sm text-[var(--ink-soft)]">
            Manage your account settings and preferences.
          </p>
          <Link
            href="/profile"
            className="btn-secondary inline-flex px-4 py-2 text-sm"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
