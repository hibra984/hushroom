'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api-client';

interface CompanionProfile {
  id: string;
  type: string;
  status: string;
  bio: string | null;
  baseRate: number;
  isOnline: boolean;
  totalSessions: number;
  successRate: number;
  averageRating: number;
  reputationScore: number;
}

interface Session {
  id: string;
  type: string;
  status: string;
  plannedDuration: number;
  createdAt: string;
  goal: { title: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_MATCH: 'bg-yellow-100 text-yellow-800',
  MATCHED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-200 text-green-900',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CompanionDashboardPage() {
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get<CompanionProfile>('/companions/me'),
      apiClient.get<Session[]>('/sessions'),
    ])
      .then(([p, s]) => {
        setProfile(p);
        setSessions(s);
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleOnline = async () => {
    if (!profile) return;
    setToggleLoading(true);
    try {
      const updated = await apiClient.patch<CompanionProfile>('/companions/me/online', {
        isOnline: !profile.isOnline,
      });
      setProfile(updated);
    } catch {
      // ignore
    } finally {
      setToggleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-red-600">{error || 'Profile not found'}</p>
        <Link href="/companion/register" className="text-sm text-blue-600 hover:underline">
          Register as Companion
        </Link>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) =>
    ['PENDING_MATCH', 'MATCHED', 'PAYMENT_AUTHORIZED', 'READY', 'IN_PROGRESS', 'PAUSED'].includes(s.status),
  );

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Companion Dashboard</h1>
        <button
          onClick={handleToggleOnline}
          disabled={toggleLoading}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            profile.isOnline
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {profile.isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      {profile.status !== 'APPROVED' && (
        <div className="mb-6 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
          Your profile is currently <strong>{profile.status.replace(/_/g, ' ').toLowerCase()}</strong>.
          {profile.status === 'PENDING_REVIEW' && ' It will be reviewed by an admin shortly.'}
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold">{profile.totalSessions}</div>
          <div className="text-xs text-gray-500">Total Sessions</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold">{profile.successRate}%</div>
          <div className="text-xs text-gray-500">Success Rate</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold">{profile.averageRating.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Avg Rating</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold">{profile.reputationScore.toFixed(0)}</div>
          <div className="text-xs text-gray-500">Reputation</div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Active Sessions</h2>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-gray-500">No active sessions.</p>
        ) : (
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{session.type.replace(/_/g, ' ')}</span>
                    {session.goal && (
                      <span className="ml-2 text-sm text-gray-500">— {session.goal.title}</span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {session.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/companion/availability"
            className="rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:border-gray-300"
          >
            <div className="text-sm font-medium">Manage Availability</div>
            <div className="mt-1 text-xs text-gray-500">Set your schedule</div>
          </Link>
          <Link
            href="/companion/profile"
            className="rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:border-gray-300"
          >
            <div className="text-sm font-medium">Edit Profile</div>
            <div className="mt-1 text-xs text-gray-500">Update bio & rates</div>
          </Link>
          <Link
            href="/sessions"
            className="rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:border-gray-300"
          >
            <div className="text-sm font-medium">Session History</div>
            <div className="mt-1 text-xs text-gray-500">View past sessions</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
