'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

interface SessionData {
  id: string;
  userId: string;
  companionId: string | null;
  type: string;
  status: string;
  plannedDuration: number;
  startedAt: string | null;
  livekitRoomName: string | null;
  goal: { title: string; description: string; successCriteria: string[] } | null;
  contract: { mode: string; rules: any[] } | null;
  companion: {
    id: string;
    user: { displayName: string | null; avatarUrl: string | null };
  } | null;
}

interface TimerState {
  elapsed: number;
  remaining: number;
  percent: number;
  phase: string;
}

interface DriftAlert {
  id: string;
  severity: string;
  message: string;
  triggerType: string;
  timestamp: string;
  acknowledgedAt: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  core: 'Core',
  closing: 'Closing',
  overtime: 'Overtime',
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'bg-blue-500/20 border-blue-500 text-blue-300',
  MEDIUM: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
  HIGH: 'bg-orange-500/20 border-orange-500 text-orange-300',
  CRITICAL: 'bg-red-500/20 border-red-500 text-red-300',
};

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timer, setTimer] = useState<TimerState>({ elapsed: 0, remaining: 0, percent: 0, phase: 'opening' });
  const [driftAlerts, setDriftAlerts] = useState<DriftAlert[]>([]);
  const [activeDrift, setActiveDrift] = useState<DriftAlert | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const driftWsRef = useRef<WebSocket | null>(null);

  // Load session data
  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<SessionData>(`/sessions/${id}`);
        setSession(data);

        // Get LiveKit token if room exists
        if (data.livekitRoomName) {
          try {
            const tokenData = await apiClient.get<{ token: string; roomName: string }>(`/media/token/${id}`);
            setLivekitToken(tokenData.token);
          } catch {
            // Room may not be created yet
          }
        }
      } catch {
        router.push('/sessions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  // Client-side timer (synced with server via WebSocket)
  const startClientTimer = useCallback(() => {
    if (!session) return;
    const plannedSeconds = session.plannedDuration * 60;
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = plannedSeconds - elapsed;
      const percent = Math.round((elapsed / plannedSeconds) * 100);

      let phase = 'opening';
      if (percent > 100) phase = 'overtime';
      else if (percent > 90) phase = 'closing';
      else if (percent > 10) phase = 'core';

      setTimer({ elapsed, remaining, percent, phase });
    }, 1000);
  }, [session]);

  useEffect(() => {
    if (session?.status === 'IN_PROGRESS') {
      startClientTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.status, startClientTimer]);

  // WebSocket connection for session events
  useEffect(() => {
    if (!session || !['READY', 'IN_PROGRESS', 'PAUSED'].includes(session.status)) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace('http', 'ws');

    // Session WebSocket
    const sessionWs = new WebSocket(`${wsUrl}/ws/session`);
    wsRef.current = sessionWs;

    sessionWs.onopen = () => {
      setIsConnected(true);
      sessionWs.send(JSON.stringify({ event: 'join-room', data: { sessionId: id } }));
    };

    sessionWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === 'session-state-update') {
        setSession((prev) => prev ? { ...prev, ...msg.data } : prev);
      }
      if (msg.event === 'timer-tick') {
        setTimer(msg.data);
      }
    };

    sessionWs.onclose = () => setIsConnected(false);

    // Drift WebSocket
    const driftWs = new WebSocket(`${wsUrl}/ws/drift`);
    driftWsRef.current = driftWs;

    driftWs.onopen = () => {
      driftWs.send(JSON.stringify({ event: 'join-session', data: { sessionId: id } }));
    };

    driftWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === 'drift-alert') {
        const alert = msg.data;
        setDriftAlerts((prev) => [alert, ...prev]);
        if (!alert.acknowledgedAt) {
          setActiveDrift(alert);
        }
      }
      if (msg.event === 'drift-acknowledged') {
        setDriftAlerts((prev) =>
          prev.map((a) => (a.id === msg.data.id ? { ...a, acknowledgedAt: msg.data.acknowledgedAt } : a)),
        );
        setActiveDrift(null);
      }
    };

    return () => {
      sessionWs.close();
      driftWs.close();
    };
  }, [session?.status, id]);

  const handleSessionAction = async (action: string) => {
    try {
      if (action === 'start' && !session?.livekitRoomName) {
        // Create room first
        await apiClient.post(`/media/rooms/${id}`);
        const tokenData = await apiClient.get<{ token: string; roomName: string }>(`/media/token/${id}`);
        setLivekitToken(tokenData.token);
      }
      const updated = await apiClient.post<SessionData>(`/sessions/${id}/${action}`);
      setSession((prev) => prev ? { ...prev, ...updated } : prev);
    } catch {
      // Handle error
    }
  };

  const handleAcknowledgeDrift = () => {
    if (!activeDrift || !driftWsRef.current) return;
    driftWsRef.current.send(
      JSON.stringify({ event: 'drift-acknowledge', data: { driftLogId: activeDrift.id } }),
    );
    setActiveDrift(null);
  };

  const handleFlagDrift = (message: string) => {
    if (!driftWsRef.current) return;
    driftWsRef.current.send(
      JSON.stringify({
        event: 'companion-drift-flag',
        data: { sessionId: id, message, severity: 'MEDIUM' },
      }),
    );
  };

  const handleEndSession = async () => {
    await handleSessionAction('end');
    router.push(`/session/${id}/evaluate`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isCompanion = session.companion?.id === user?.id;
  const isInProgress = session.status === 'IN_PROGRESS';
  const isPaused = session.status === 'PAUSED';
  const isReady = session.status === 'READY';

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">{session.type.replace(/_/g, ' ')} Session</span>
          <span className="rounded-full bg-gray-700 px-3 py-1 text-xs">
            {session.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {session.companion?.user.displayName || 'No companion'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left: Session Area */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          {/* Timer */}
          <div className="mb-8 text-center">
            <div className={`text-6xl font-mono font-bold ${timer.phase === 'overtime' ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timer.remaining)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className={`text-sm ${timer.phase === 'overtime' ? 'text-red-400' : 'text-gray-400'}`}>
                {PHASE_LABELS[timer.phase] || timer.phase}
              </span>
              <span className="text-sm text-gray-600">|</span>
              <span className="text-sm text-gray-400">{timer.percent}%</span>
            </div>

            {/* Progress bar */}
            <div className="mx-auto mt-4 h-2 w-80 overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${
                  timer.percent > 100 ? 'bg-red-500' : timer.percent > 90 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(timer.percent, 100)}%` }}
              />
            </div>
          </div>

          {/* Audio Participants */}
          <div className="mb-8 flex items-center gap-8">
            <div className="text-center">
              <div className={`mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full ${
                isInProgress ? 'bg-blue-600 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : 'bg-gray-700'
              }`}>
                <span className="text-2xl font-bold">
                  {(user?.displayName || user?.firstName || 'U')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-400">You</span>
            </div>

            <div className="text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            </div>

            <div className="text-center">
              <div className={`mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full ${
                isInProgress ? 'bg-green-600 ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900' : 'bg-gray-700'
              }`}>
                <span className="text-2xl font-bold">
                  {(session.companion?.user.displayName || 'C')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {session.companion?.user.displayName || 'Companion'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {isReady && (
              <button
                onClick={() => handleSessionAction('start')}
                className="rounded-full bg-green-600 px-8 py-3 font-semibold transition hover:bg-green-500"
              >
                Start Session
              </button>
            )}

            {isInProgress && (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`rounded-full p-4 transition ${
                    isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleSessionAction('pause')}
                  className="rounded-full bg-yellow-600 px-6 py-3 font-semibold transition hover:bg-yellow-500"
                >
                  Pause
                </button>

                <button
                  onClick={handleEndSession}
                  className="rounded-full bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500"
                >
                  End Session
                </button>

                {isCompanion && (
                  <button
                    onClick={() => handleFlagDrift('Conversation drifting from goal')}
                    className="rounded-full bg-orange-600 px-6 py-3 font-semibold transition hover:bg-orange-500"
                  >
                    Flag Drift
                  </button>
                )}
              </>
            )}

            {isPaused && (
              <>
                <button
                  onClick={() => handleSessionAction('resume')}
                  className="rounded-full bg-green-600 px-8 py-3 font-semibold transition hover:bg-green-500"
                >
                  Resume
                </button>
                <button
                  onClick={handleEndSession}
                  className="rounded-full bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500"
                >
                  End Session
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Goal + Drift Log */}
        <div className="w-80 border-l border-gray-700 p-4">
          {/* Goal */}
          {session.goal && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-400">Goal</h3>
              <p className="text-sm font-medium">{session.goal.title}</p>
              <p className="mt-1 text-xs text-gray-400">{session.goal.description}</p>
              {session.goal.successCriteria.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {session.goal.successCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="mt-0.5 text-gray-500">&#9679;</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Contract */}
          {session.contract && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-400">Contract</h3>
              <span className="rounded bg-gray-700 px-2 py-1 text-xs">{session.contract.mode}</span>
            </div>
          )}

          {/* Drift Alerts */}
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-400">
              Drift Log ({driftAlerts.length})
            </h3>
            {driftAlerts.length === 0 ? (
              <p className="text-xs text-gray-500">No drift alerts yet.</p>
            ) : (
              <div className="space-y-2">
                {driftAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded border p-2 text-xs ${SEVERITY_STYLES[alert.severity] || 'border-gray-600'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{alert.severity}</span>
                      <span className="text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1">{alert.message}</p>
                    {alert.acknowledgedAt && (
                      <p className="mt-1 text-gray-500">Acknowledged</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drift Alert Modal */}
      {activeDrift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className={`mx-4 max-w-md rounded-xl border p-6 ${SEVERITY_STYLES[activeDrift.severity] || 'border-gray-600 bg-gray-800'}`}>
            <h2 className="mb-2 text-lg font-bold">
              {activeDrift.severity === 'CRITICAL' ? 'CRITICAL: ' : ''}Drift Alert
            </h2>
            <p className="mb-4">{activeDrift.message}</p>
            <button
              onClick={handleAcknowledgeDrift}
              className="w-full rounded-lg bg-white py-2 font-semibold text-gray-900 transition hover:bg-gray-200"
            >
              I Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
