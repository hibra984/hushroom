'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="py-8">
      <h1 className="mb-2 text-2xl font-bold">
        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mb-8 text-gray-500">
        Your Hushroom dashboard. Upcoming sessions and activity will appear here.
      </p>

      {user && !user.isEmailVerified && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Your email is not verified. Please check your inbox for a verification link.
        </div>
      )}

      {user && !user.isAgeVerified && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Age verification is required to book sessions.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-2 font-semibold">Book a Session</h3>
          <p className="mb-4 text-sm text-gray-500">
            Start a new goal-bound presence session with a companion.
          </p>
          <Link
            href="/sessions/new"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Session
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-2 font-semibold">Session History</h3>
          <p className="mb-4 text-sm text-gray-500">
            View your past sessions, ratings, and outcomes.
          </p>
          <Link
            href="/sessions"
            className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Sessions
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-2 font-semibold">Your Profile</h3>
          <p className="mb-4 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
          <Link
            href="/profile"
            className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
