import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, ApiClientError } from '../../lib/api-client';

const SESSION_TYPES = [
  { key: 'FOCUS', label: 'Focus', description: 'Stay focused on a specific task.', duration: 30 },
  { key: 'DECISION', label: 'Decision', description: 'Work through a decision.', duration: 45 },
  { key: 'EMOTIONAL_UNLOAD', label: 'Emotional Unload', description: 'Express and process emotions.', duration: 30 },
  { key: 'PLANNING', label: 'Planning', description: 'Plan with structured accountability.', duration: 60 },
];

interface ScoredCompanion {
  companionId: string;
  displayName: string | null;
  type: string;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  averageRating: number;
  totalSessions: number;
  isOnline: boolean;
  score: number;
  breakdown: {
    goalMatch: number;
    reputation: number;
    fairDistribution: number;
    priceFit: number;
  };
}

const TOTAL_STEPS = 4;

export default function NewSessionScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Session type
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [plannedDuration, setPlannedDuration] = useState(30);

  // Step 2: Goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState(['']);

  // Step 3: Matching
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matches, setMatches] = useState<ScoredCompanion[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const addCriteria = () => setSuccessCriteria([...successCriteria, '']);
  const updateCriteria = (index: number, value: string) => {
    const updated = [...successCriteria];
    updated[index] = value;
    setSuccessCriteria(updated);
  };

  const handleCreateAndMatch = async () => {
    if (!sessionType) return;
    setIsLoading(true);
    try {
      // Create session
      const session = await apiClient.post<{ id: string }>('/sessions', {
        type: sessionType,
        plannedDuration,
      });
      setSessionId(session.id);

      // Create goal
      await apiClient.post('/goals', {
        sessionId: session.id,
        title: goalTitle,
        description: goalDescription,
        successCriteria: successCriteria.filter(Boolean),
      });

      // Create contract
      await apiClient.post('/contracts', {
        sessionId: session.id,
        mode: 'MODERATE',
      });

      // Find matches
      setStep(3);
      setMatchLoading(true);
      const results = await apiClient.post<ScoredCompanion[]>('/matching/find', {
        sessionId: session.id,
      });
      setMatches(results);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to create session';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
      setMatchLoading(false);
    }
  };

  const handleSelectCompanion = async (companionId: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await apiClient.post('/matching/select', {
        sessionId,
        companionId,
      });
      setStep(4);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to select companion';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipMatching = () => {
    setStep(4);
  };

  const renderMatch = ({ item }: { item: ScoredCompanion }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchNameRow}>
          <View style={[styles.matchAvatar, !item.isOnline && styles.matchAvatarOff]}>
            <Text style={styles.matchAvatarText}>
              {(item.displayName || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.matchName}>{item.displayName || 'Companion'}</Text>
            <Text style={styles.matchType}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{Math.round(item.score * 100)}%</Text>
        </View>
      </View>

      {item.bio && (
        <Text style={styles.matchBio} numberOfLines={2}>{item.bio}</Text>
      )}

      {item.expertiseTags.length > 0 && (
        <View style={styles.matchTags}>
          {item.expertiseTags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.matchTag}>
              <Text style={styles.matchTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.matchStats}>
        <Text style={styles.matchStat}>{item.averageRating.toFixed(1)} rating</Text>
        <Text style={styles.matchStatSep}>|</Text>
        <Text style={styles.matchStat}>{item.totalSessions} sessions</Text>
        <Text style={styles.matchStatSep}>|</Text>
        <Text style={styles.matchStat}>${item.baseRate}/hr</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Goal</Text>
          <Text style={styles.breakdownValue}>{Math.round(item.breakdown.goalMatch * 100)}%</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Rep</Text>
          <Text style={styles.breakdownValue}>{Math.round(item.breakdown.reputation * 100)}%</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Fair</Text>
          <Text style={styles.breakdownValue}>{Math.round(item.breakdown.fairDistribution * 100)}%</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Price</Text>
          <Text style={styles.breakdownValue}>{Math.round(item.breakdown.priceFit * 100)}%</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => handleSelectCompanion(item.companionId)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.selectButtonText}>Select</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <View
            key={s}
            style={[styles.progressBar, { backgroundColor: s <= step ? '#2563eb' : '#e5e7eb' }]}
          />
        ))}
      </View>

      {/* Step 1: Session Type */}
      {step === 1 && (
        <View>
          <Text style={styles.heading}>What kind of session?</Text>
          {SESSION_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, sessionType === t.key && styles.typeCardSelected]}
              onPress={() => {
                setSessionType(t.key);
                setPlannedDuration(t.duration);
              }}
            >
              <Text style={styles.typeLabel}>{t.label}</Text>
              <Text style={styles.typeDesc}>{t.description}</Text>
              <Text style={styles.typeMeta}>{t.duration} min default</Text>
            </TouchableOpacity>
          ))}

          {sessionType && (
            <View style={styles.durationRow}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.durationInput}
                keyboardType="number-pad"
                value={String(plannedDuration)}
                onChangeText={(v) => setPlannedDuration(Number(v) || 15)}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !sessionType && styles.disabledButton]}
            disabled={!sessionType}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryButtonText}>Next: Define Goal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Goal */}
      {step === 2 && (
        <View>
          <Text style={styles.heading}>Define your goal</Text>

          <Text style={styles.label}>Goal Title</Text>
          <TextInput
            style={styles.input}
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder="e.g., Finish quarterly report draft"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder="Describe what you want to accomplish..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Success Criteria</Text>
          {successCriteria.map((c, i) => (
            <TextInput
              key={i}
              style={[styles.input, { marginBottom: 8 }]}
              value={c}
              onChangeText={(v) => updateCriteria(i, v)}
              placeholder={`Criterion ${i + 1}`}
            />
          ))}
          <TouchableOpacity onPress={addCriteria}>
            <Text style={styles.link}>+ Add criterion</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.flex1,
                (!goalTitle || !goalDescription) && styles.disabledButton,
              ]}
              disabled={!goalTitle || !goalDescription || isLoading}
              onPress={handleCreateAndMatch}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Find Companions</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Matching Results */}
      {step === 3 && (
        <View>
          <Text style={styles.heading}>Choose a Companion</Text>

          {matchLoading ? (
            <View style={styles.matchLoadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.matchLoadingText}>Finding the best matches...</Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.noMatches}>
              <Text style={styles.noMatchesTitle}>No companions available</Text>
              <Text style={styles.noMatchesText}>
                Try again later or adjust your session settings.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSkipMatching}>
                <Text style={styles.primaryButtonText}>Continue Without Match</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.subtitle}>
                {matches.length} companion{matches.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={matches}
                renderItem={renderMatch}
                keyExtractor={(item) => item.companionId}
                scrollEnabled={false}
              />
              <TouchableOpacity
                style={[styles.secondaryButton, { marginBottom: 24 }]}
                onPress={handleSkipMatching}
              >
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>&#10003;</Text>
          <Text style={styles.successTitle}>Session Created!</Text>
          <Text style={styles.successText}>
            Your session has been set up successfully.
          </Text>
          {sessionId && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace(`/session/${sessionId}`)}
            >
              <Text style={styles.primaryButtonText}>View Session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back to Sessions</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  progress: { flexDirection: 'row', gap: 4, marginBottom: 24 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4, marginTop: 12 },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  typeLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  typeDesc: { fontSize: 13, color: '#6b7280' },
  typeMeta: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  durationRow: { marginTop: 16 },
  durationInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 100,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginTop: 4,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  link: { color: '#2563eb', fontSize: 14, marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  flex1: { flex: 1 },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  secondaryButtonText: { color: '#374151', fontSize: 16 },
  disabledButton: { opacity: 0.5 },

  // Matching styles
  matchLoadingContainer: { alignItems: 'center', paddingVertical: 40 },
  matchLoadingText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  noMatches: { alignItems: 'center', paddingVertical: 32 },
  noMatchesTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  noMatchesText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatarOff: { backgroundColor: '#9ca3af' },
  matchAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  matchName: { fontSize: 15, fontWeight: '600' },
  matchType: { fontSize: 12, color: '#6b7280' },
  scoreBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  matchBio: { fontSize: 13, color: '#6b7280', marginTop: 8, lineHeight: 18 },
  matchTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  matchTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchTagText: { fontSize: 11, color: '#4b5563' },
  matchStats: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  matchStat: { fontSize: 12, color: '#6b7280' },
  matchStatSep: { fontSize: 12, color: '#d1d5db', marginHorizontal: 6 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  breakdownItem: { alignItems: 'center' },
  breakdownLabel: { fontSize: 10, color: '#9ca3af' },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  selectButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  selectButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Success styles
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successIcon: { fontSize: 48, color: '#22c55e', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
});
