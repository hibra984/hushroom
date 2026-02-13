import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../lib/api-client';

interface CompanionDetail {
  id: string;
  type: string;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  averageRating: number;
  reputationScore: number;
  totalSessions: number;
  successRate: number;
  isOnline: boolean;
  maxConcurrent: number;
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    languagePreferences: { language: string; proficiency: string }[];
  };
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  VERIFIED: 'Verified',
  EXPERT: 'Expert',
};

export default function CompanionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [companion, setCompanion] = useState<CompanionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<CompanionDetail>(`/companions/${id}`);
        setCompanion(data);
      } catch {
        setCompanion(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!companion) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Companion not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalRate = companion.baseRate + (companion.expertPremium ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, !companion.isOnline && styles.avatarOffline]}>
          <Text style={styles.avatarText}>
            {(companion.user.displayName || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{companion.user.displayName || 'Companion'}</Text>
          <Text style={styles.type}>{TYPE_LABELS[companion.type] || companion.type}</Text>
          {companion.isOnline && <Text style={styles.onlineText}>Online now</Text>}
        </View>
      </View>

      {/* Bio */}
      {companion.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{companion.bio}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{companion.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{companion.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{companion.successRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{companion.reputationScore.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Reputation</Text>
          </View>
        </View>
      </View>

      {/* Expertise */}
      {companion.expertiseTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.tags}>
            {companion.expertiseTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Languages */}
      {companion.user.languagePreferences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          {companion.user.languagePreferences.map((lp) => (
            <Text key={lp.language} style={styles.langText}>
              {lp.language} — {lp.proficiency}
            </Text>
          ))}
        </View>
      )}

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <Text style={styles.priceText}>${companion.baseRate}/hr base rate</Text>
        {companion.expertPremium ? (
          <Text style={styles.priceSubtext}>
            +${companion.expertPremium} expert premium (${totalRate}/hr total)
          </Text>
        ) : null}
      </View>

      {/* Availability */}
      {companion.availability.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          {DAYS.filter((d) =>
            companion.availability.some((a) => a.dayOfWeek === d),
          ).map((day) => {
            const slots = companion.availability.filter((a) => a.dayOfWeek === day);
            return (
              <View key={day} style={styles.availRow}>
                <Text style={styles.dayLabel}>{DAY_SHORT[day]}</Text>
                <Text style={styles.timeText}>
                  {slots.map((s) => `${s.startTime} - ${s.endTime}`).join(', ')}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Book */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push('/session/new')}
      >
        <Text style={styles.bookButtonText}>Book a Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 12 },
  link: { color: '#2563eb', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOffline: { backgroundColor: '#9ca3af' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerInfo: { gap: 4 },
  name: { fontSize: 22, fontWeight: '700' },
  type: { fontSize: 14, color: '#6b7280' },
  onlineText: { fontSize: 13, color: '#22c55e', fontWeight: '500' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  bioText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { fontSize: 12, color: '#2563eb' },
  langText: { fontSize: 14, color: '#4b5563', marginBottom: 4 },
  priceText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  priceSubtext: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  availRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dayLabel: { width: 40, fontSize: 13, fontWeight: '600', color: '#374151' },
  timeText: { fontSize: 13, color: '#6b7280' },
  bookButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
