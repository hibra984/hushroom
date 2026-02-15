'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api-client';

interface Goal {
  id: string;
  title: string;
  description: string;
  successCriteria: string[];
  isAchieved: boolean | null;
}

interface Contract {
  id: string;
  mode: string;
  rules: { type: string; description?: string }[];
  acceptedByUser: boolean;
  acceptedByCompanion: boolean;
}

interface Session {
  id: string;
  type: string;
  status: string;
  plannedDuration: number;
  durationMinutes: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  goal: Goal | null;
  contract: Contract | null;
  companion: { id: string; bio: string | null; type: string } | null;
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

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const sessionId = params.id as string;

  useEffect(() => {
    apiClient
      .get<Session>(`/sessions/${sessionId}`)
      .then(setSession)
      .catch(() => setError('Session not found'))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiClient.post<Session>(`/sessions/${sessionId}/${action}`);
      setSession(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiClient.post<Session>(`/sessions/${sessionId}/cancel`, {});
      setSession(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-red-600">{error || 'Session not found'}</p>
        <Link href="/sessions" className="text-sm font-semibold text-[#0f7a5b] hover:text-[#0a6047]">
          Back to Sessions
        </Link>
      </div>
    );
  }

  const canCancel = ['PENDING_MATCH', 'MATCHED', 'PAYMENT_AUTHORIZED', 'READY'].includes(session.status);
  const canStart = session.status === 'READY';
  const canPause = session.status === 'IN_PROGRESS';
  const canResume = session.status === 'PAUSED';
  const canEnd = ['IN_PROGRESS', 'PAUSED'].includes(session.status);

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-6">
      <Link href="/sessions" className="mb-4 inline-block text-sm font-semibold text-[#0f7a5b] hover:text-[#0a6047]">
        {'<-'} Back to Sessions
      </Link>

      <div className="surface-card rounded-3xl p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {TYPE_LABELS[session.type] || session.type} Session
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Created {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {session.status.replace(/_/g, ' ')}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[var(--ink-soft)]">Planned Duration</span>
            <p className="font-medium">{session.plannedDuration} min</p>
          </div>
          {session.durationMinutes && (
            <div>
              <span className="text-[var(--ink-soft)]">Actual Duration</span>
              <p className="font-medium">{session.durationMinutes} min</p>
            </div>
          )}
          {session.startedAt && (
            <div>
              <span className="text-[var(--ink-soft)]">Started</span>
              <p className="font-medium">{new Date(session.startedAt).toLocaleString()}</p>
            </div>
          )}
          {session.endedAt && (
            <div>
              <span className="text-[var(--ink-soft)]">Ended</span>
              <p className="font-medium">{new Date(session.endedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        {session.cancellationReason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3">
            <span className="text-xs font-medium text-red-700">Cancellation Reason</span>
            <p className="text-sm text-red-600">{session.cancellationReason}</p>
          </div>
        )}

        {session.goal && (
          <div className="mb-6 rounded-2xl bg-[#f2f8f4] p-4">
            <h3 className="mb-2 text-sm font-semibold text-[#355145]">Goal</h3>
            <p className="font-medium">{session.goal.title}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{session.goal.description}</p>
            {session.goal.successCriteria.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-[var(--ink-soft)]">Success Criteria</span>
                <ul className="mt-1 space-y-1">
                  {session.goal.successCriteria.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                      <span className="text-[#9eb6a8]">&bull;</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {session.contract && (
          <div className="mb-6 rounded-2xl bg-[#f2f8f4] p-4">
            <h3 className="mb-2 text-sm font-semibold text-[#355145]">Contract</h3>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-[#dde7e0] px-2 py-0.5 text-xs font-semibold text-[#355145]">
                {session.contract.mode}
              </span>
              <span className="text-xs text-[var(--ink-soft)]">
                User: {session.contract.acceptedByUser ? 'Accepted' : 'Pending'} |
                Companion: {session.contract.acceptedByCompanion ? 'Accepted' : 'Pending'}
              </span>
            </div>
            {session.contract.rules.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {session.contract.rules.map((r, i) => (
                  <span
                    key={i}
                    className="rounded bg-[#dde7e0] px-1.5 py-0.5 text-xs text-[#4c6258]"
                  >
                    {r.description || r.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canStart && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="btn-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50"
            >
              Start Session
            </button>
          )}
          {canPause && (
            <button
              onClick={() => handleAction('pause')}
              disabled={actionLoading}
              className="rounded-xl bg-[#E5A22A] px-4 py-2 text-sm font-semibold text-[#2d2615] hover:bg-[#d8961f] disabled:opacity-50"
            >
              Pause
            </button>
          )}
          {canResume && (
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading}
              className="btn-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50"
            >
              Resume
            </button>
          )}
          {canEnd && (
            <button
              onClick={() => handleAction('end')}
              disabled={actionLoading}
              className="btn-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50"
            >
              End Session
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
