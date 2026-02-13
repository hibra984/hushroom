import { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../lib/api-client';

interface SessionData {
  id: string;
  userId: string;
  companionId: string | null;
  type: string;
  status: string;
  plannedDuration: number;
  startedAt: string | null;
  goal: { title: string; description: string; successCriteria: string[] } | null;
  companion: {
    id: string;
    user: { displayName: string | null };
  } | null;
}

interface DriftAlert {
  id: string;
  severity: string;
  message: string;
  timestamp: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState('opening');
  const [isMuted, setIsMuted] = useState(false);
  const [driftAlerts, setDriftAlerts] = useState<DriftAlert[]>([]);
  const [activeDrift, setActiveDrift] = useState<DriftAlert | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<SessionData>(`/sessions/${id}`);
        setSession(data);
      } catch {
        router.back();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  const startTimer = useCallback(() => {
    if (!session) return;
    const plannedSeconds = session.plannedDuration * 60;
    const startTime = session.startedAt
      ? new Date(session.startedAt).getTime()
      : Date.now();

    timerRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - startTime) / 1000);
      const r = plannedSeconds - e;
      const p = Math.round((e / plannedSeconds) * 100);

      let ph = 'opening';
      if (p > 100) ph = 'overtime';
      else if (p > 90) ph = 'closing';
      else if (p > 10) ph = 'core';

      setElapsed(e);
      setRemaining(r);
      setPercent(p);
      setPhase(ph);
    }, 1000);
  }, [session]);

  useEffect(() => {
    if (session?.status === 'IN_PROGRESS') {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.status, startTimer]);

  const handleAction = async (action: string) => {
    try {
      if (action === 'start' && session && !session.startedAt) {
        await apiClient.post(`/media/rooms/${id}`);
      }
      const updated = await apiClient.post<SessionData>(
        `/sessions/${id}/${action}`,
      );
      setSession((prev) => (prev ? { ...prev, ...updated } : prev));
      if (action === 'end') {
        router.replace(`/session/evaluate?id=${id}`);
      }
    } catch {
      // Handle error
    }
  };

  if (isLoading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isInProgress = session.status === 'IN_PROGRESS';
  const isPaused = session.status === 'PAUSED';
  const isReady = session.status === 'READY';

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.sessionType}>{session.type.replace(/_/g, ' ')}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{session.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text
          style={[
            styles.timerText,
            phase === 'overtime' && { color: '#ef4444' },
          ]}
        >
          {formatTime(remaining)}
        </Text>
        <Text style={[styles.phaseText, phase === 'overtime' && { color: '#ef4444' }]}>
          {phase.charAt(0).toUpperCase() + phase.slice(1)} | {percent}%
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percent, 100)}%`,
                backgroundColor:
                  percent > 100 ? '#ef4444' : percent > 90 ? '#eab308' : '#2563eb',
              },
            ]}
          />
        </View>
      </View>

      {/* Participants */}
      <View style={styles.participants}>
        <View style={styles.participant}>
          <View style={[styles.avatar, { backgroundColor: '#2563eb' }]}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.participantName}>You</Text>
        </View>
        <Text style={styles.connectionDots}>...</Text>
        <View style={styles.participant}>
          <View style={[styles.avatar, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.avatarText}>
              {(session.companion?.user.displayName || 'C')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.participantName}>
            {session.companion?.user.displayName || 'Companion'}
          </Text>
        </View>
      </View>

      {/* Goal */}
      {session.goal && (
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>GOAL</Text>
          <Text style={styles.goalTitle}>{session.goal.title}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {isReady && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#22c55e' }]}
            onPress={() => handleAction('start')}
          >
            <Text style={styles.controlText}>Start Session</Text>
          </TouchableOpacity>
        )}

        {isInProgress && (
          <>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: isMuted ? '#ef4444' : '#374151' }]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#eab308' }]}
              onPress={() => handleAction('pause')}
            >
              <Text style={styles.controlText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleAction('end')}
            >
              <Text style={styles.controlText}>End</Text>
            </TouchableOpacity>
          </>
        )}

        {isPaused && (
          <>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#22c55e' }]}
              onPress={() => handleAction('resume')}
            >
              <Text style={styles.controlText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleAction('end')}
            >
              <Text style={styles.controlText}>End</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Drift Alert Modal */}
      <Modal visible={!!activeDrift} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { borderColor: SEVERITY_COLORS[activeDrift?.severity || 'LOW'] },
            ]}
          >
            <Text style={styles.modalTitle}>Drift Alert</Text>
            <Text style={styles.modalMessage}>{activeDrift?.message}</Text>
            <TouchableOpacity
              style={styles.ackButton}
              onPress={() => setActiveDrift(null)}
            >
              <Text style={styles.ackButtonText}>I Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sessionType: { color: '#9ca3af', fontSize: 14 },
  statusBadge: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12 },
  timerContainer: { alignItems: 'center', paddingVertical: 40 },
  timerText: { color: '#fff', fontSize: 64, fontWeight: '700', fontVariant: ['tabular-nums'] },
  phaseText: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  participant: { alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  participantName: { color: '#9ca3af', fontSize: 12 },
  connectionDots: { color: '#4b5563', fontSize: 20 },
  goalCard: {
    marginHorizontal: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  goalLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  goalTitle: { color: '#fff', fontSize: 14, fontWeight: '500' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  controlText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    borderWidth: 2,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalMessage: { color: '#d1d5db', fontSize: 14, marginBottom: 20 },
  ackButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ackButtonText: { color: '#111827', fontSize: 16, fontWeight: '600' },
});
