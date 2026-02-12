import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, ApiClientError } from '../../lib/api-client';

interface Goal {
  title: string;
  description: string;
  successCriteria: string[];
}

interface Contract {
  mode: string;
  acceptedByUser: boolean;
  acceptedByCompanion: boolean;
}

interface Session {
  id: string;
  type: string;
  status: string;
  plannedDuration: number;
  durationMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  goal: Goal | null;
  contract: Contract | null;
}

const TYPE_LABELS: Record<string, string> = {
  FOCUS: 'Focus',
  DECISION: 'Decision',
  EMOTIONAL_UNLOAD: 'Emotional Unload',
  PLANNING: 'Planning',
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<Session>(`/sessions/${id}`)
      .then(setSession)
      .catch(() => Alert.alert('Error', 'Session not found'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const body = action === 'cancel' ? {} : undefined;
      const updated = await apiClient.post<Session>(`/sessions/${id}/${action}`, body);
      setSession(updated);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Action failed';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canCancel = ['PENDING_MATCH', 'MATCHED', 'PAYMENT_AUTHORIZED', 'READY'].includes(session.status);
  const canStart = session.status === 'READY';
  const canPause = session.status === 'IN_PROGRESS';
  const canResume = session.status === 'PAUSED';
  const canEnd = ['IN_PROGRESS', 'PAUSED'].includes(session.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>
          {TYPE_LABELS[session.type] || session.type} Session
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{session.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <Text style={styles.meta}>
        Created {new Date(session.createdAt).toLocaleString()}
      </Text>

      {/* Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Planned</Text>
          <Text style={styles.infoValue}>{session.plannedDuration} min</Text>
        </View>
        {session.durationMinutes != null && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Actual</Text>
            <Text style={styles.infoValue}>{session.durationMinutes} min</Text>
          </View>
        )}
      </View>

      {/* Goal */}
      {session.goal && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <Text style={styles.goalTitle}>{session.goal.title}</Text>
          <Text style={styles.goalDesc}>{session.goal.description}</Text>
          {session.goal.successCriteria.length > 0 && (
            <View style={styles.criteria}>
              {session.goal.successCriteria.map((c, i) => (
                <Text key={i} style={styles.criterion}>• {c}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Contract */}
      {session.contract && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract</Text>
          <Text style={styles.contractMode}>Mode: {session.contract.mode}</Text>
        </View>
      )}

      {session.cancellationReason && (
        <View style={[styles.section, styles.cancelSection]}>
          <Text style={styles.cancelLabel}>Cancellation Reason</Text>
          <Text style={styles.cancelText}>{session.cancellationReason}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.greenButton]}
            onPress={() => handleAction('start')}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Start Session</Text>
          </TouchableOpacity>
        )}
        {canPause && (
          <TouchableOpacity
            style={[styles.actionButton, styles.yellowButton]}
            onPress={() => handleAction('pause')}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        {canResume && (
          <TouchableOpacity
            style={[styles.actionButton, styles.greenButton]}
            onPress={() => handleAction('resume')}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
        {canEnd && (
          <TouchableOpacity
            style={[styles.actionButton, styles.blueButton]}
            onPress={() => handleAction('end')}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>End Session</Text>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, styles.redButton]}
            onPress={() => handleAction('cancel')}
            disabled={actionLoading}
          >
            <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        {actionLoading && <ActivityIndicator style={{ marginTop: 12 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#dc2626', marginBottom: 12 },
  link: { color: '#2563eb', fontSize: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heading: { fontSize: 22, fontWeight: 'bold' },
  statusBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '500' },
  meta: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  infoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  goalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  goalDesc: { fontSize: 14, color: '#4b5563' },
  criteria: { marginTop: 12 },
  criterion: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  contractMode: { fontSize: 14, color: '#4b5563' },
  cancelSection: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  cancelLabel: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  cancelText: { fontSize: 14, color: '#b91c1c', marginTop: 4 },
  actions: { marginTop: 8, gap: 8 },
  actionButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  greenButton: { backgroundColor: '#16a34a' },
  yellowButton: { backgroundColor: '#ca8a04' },
  blueButton: { backgroundColor: '#2563eb' },
  redButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5' },
});
