'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Session {
  id: string;
  type: string;
  status: string;
  plannedDuration: number;
  durationMinutes: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  goal: { title: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_MATCH: 'bg-yellow-100 text-yellow-800',
  MATCHED: 'bg-blue-100 text-blue-800',
  PAYMENT_AUTHORIZED: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-green-200 text-green-900',
  PAUSED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ABANDONED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-red-200 text-red-900',
};

const TYPE_LABELS: Record<string, string> = {
  FOCUS: 'Focus',
  DECISION: 'Decision',
  EMOTIONAL_UNLOAD: 'Emotional Unload',
  PLANNING: 'Planning',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? `?status=${filter}` : '';
    apiClient
      .get<Session[]>(`/sessions${params}`)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setIsLoading(false));
  }, [filter]);

  const activeStatuses = ['PENDING_MATCH', 'MATCHED', 'PAYMENT_AUTHORIZED', 'READY', 'IN_PROGRESS', 'PAUSED'];
  const activeSessions = sessions.filter((s) => activeStatuses.includes(s.status));
  const pastSessions = sessions.filter((s) => !activeStatuses.includes(s.status));

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Link
          href="/sessions/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Book New Session
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {['', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setIsLoading(true); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="mb-4 text-gray-500">No sessions found.</p>
          <Link
            href="/sessions/new"
            className="text-sm text-blue-600 hover:underline"
          >
            Book your first session
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSessions.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Active
              </h2>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Past
              </h2>
              <div className="space-y-2">
                {pastSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {TYPE_LABELS[session.type] || session.type}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {session.status.replace(/_/g, ' ')}
            </span>
          </div>
          {session.goal && (
            <p className="mt-1 text-sm text-gray-600">{session.goal.title}</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>{session.plannedDuration} min planned</div>
          <div>{new Date(session.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </Link>
  );
}
