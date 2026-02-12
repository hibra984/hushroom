import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/api-client';

interface Session {
  id: string;
  type: string;
  status: string;
  plannedDuration: number;
  createdAt: string;
  goal: { title: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  FOCUS: 'Focus',
  DECISION: 'Decision',
  EMOTIONAL_UNLOAD: 'Emotional Unload',
  PLANNING: 'Planning',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_MATCH: '#fef3c7',
  MATCHED: '#dbeafe',
  IN_PROGRESS: '#bbf7d0',
  COMPLETED: '#f3f4f6',
  CANCELLED: '#fee2e2',
};

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiClient.get<Session[]>('/sessions');
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#f3f4f6' }]}>
          <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      {item.goal && <Text style={styles.goalTitle}>{item.goal.title}</Text>}
      <Text style={styles.meta}>
        {item.plannedDuration} min | {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/session/new')}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet.</Text>
          <TouchableOpacity onPress={() => router.push('/session/new')}>
            <Text style={styles.link}>Book your first session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  newButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardType: { fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '500' },
  goalTitle: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af', marginBottom: 12 },
  link: { color: '#2563eb', fontSize: 14 },
});
