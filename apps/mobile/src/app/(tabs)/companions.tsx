import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/api-client';

interface Companion {
  id: string;
  type: string;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  averageRating: number;
  totalSessions: number;
  isOnline: boolean;
  user: {
    displayName: string | null;
    avatarUrl: string | null;
  };
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  STANDARD: { label: 'Standard', color: '#dbeafe' },
  VERIFIED: { label: 'Verified', color: '#d1fae5' },
  EXPERT: { label: 'Expert', color: '#fef3c7' },
};

export default function CompanionsScreen() {
  const router = useRouter();
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState('');

  const loadCompanions = useCallback(async () => {
    try {
      let url = '/companions?';
      if (onlineOnly) url += 'onlineOnly=true&';
      if (search.trim()) url += `expertise=${encodeURIComponent(search.trim())}&`;
      const data = await apiClient.get<Companion[]>(url);
      setCompanions(data);
    } catch {
      setCompanions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [onlineOnly, search]);

  useEffect(() => {
    setIsLoading(true);
    loadCompanions();
  }, [loadCompanions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCompanions();
  };

  const renderCompanion = ({ item }: { item: Companion }) => {
    const badge = TYPE_BADGES[item.type] || TYPE_BADGES.STANDARD;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/companion/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <View style={[styles.avatar, !item.isOnline && styles.avatarOffline]}>
              <Text style={styles.avatarText}>
                {(item.user.displayName || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.name}>{item.user.displayName || 'Companion'}</Text>
              <View style={[styles.typeBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.typeText}>{badge.label}</Text>
              </View>
            </View>
          </View>
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        {item.expertiseTags.length > 0 && (
          <View style={styles.tags}>
            {item.expertiseTags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.expertiseTags.length > 3 && (
              <Text style={styles.moreText}>+{item.expertiseTags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.stats}>
          <Text style={styles.stat}>
            {item.averageRating.toFixed(1)} rating
          </Text>
          <Text style={styles.statSep}>|</Text>
          <Text style={styles.stat}>{item.totalSessions} sessions</Text>
          <Text style={styles.statSep}>|</Text>
          <Text style={styles.stat}>${item.baseRate}/hr</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expertise..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Online</Text>
          <Switch value={onlineOnly} onValueChange={setOnlineOnly} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : companions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No companions found.</Text>
        </View>
      ) : (
        <FlatList
          data={companions}
          renderItem={renderCompanion}
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchLabel: { fontSize: 13, color: '#6b7280' },
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
    alignItems: 'flex-start',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOffline: { backgroundColor: '#9ca3af' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nameCol: { gap: 4 },
  name: { fontSize: 16, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '500' },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginTop: 4,
  },
  bio: { fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, color: '#4b5563' },
  moreText: { fontSize: 11, color: '#9ca3af', alignSelf: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  stat: { fontSize: 12, color: '#6b7280' },
  statSep: { fontSize: 12, color: '#d1d5db', marginHorizontal: 8 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
