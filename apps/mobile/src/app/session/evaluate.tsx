import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, ApiClientError } from '../../lib/api-client';

const DIMENSIONS = [
  { key: 'goalAchievement', label: 'Goal Achievement' },
  { key: 'presenceQuality', label: 'Presence Quality' },
  { key: 'contractAdherence', label: 'Contract Adherence' },
  { key: 'communication', label: 'Communication' },
];

export default function EvaluateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [overallScore, setOverallScore] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (overallScore === 0) return;
    setIsLoading(true);
    try {
      await apiClient.post('/ratings', {
        sessionId: id,
        overallScore,
        ...scores,
        comment: comment || undefined,
        isPublic,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to submit';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.center}>
        <Text style={styles.checkmark}>&#10003;</Text>
        <Text style={styles.thankTitle}>Thank You!</Text>
        <Text style={styles.thankText}>Your evaluation has been submitted.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/sessions')}>
          <Text style={styles.primaryButtonText}>Back to Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Rate Your Session</Text>

      {/* Overall */}
      <Text style={styles.label}>Overall Score</Text>
      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.scoreButton, n <= overallScore && styles.scoreActive]}
            onPress={() => setOverallScore(n)}
          >
            <Text style={[styles.scoreText, n <= overallScore && styles.scoreTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dimensions */}
      {DIMENSIONS.map((dim) => (
        <View key={dim.key} style={styles.dimSection}>
          <Text style={styles.dimLabel}>{dim.label}</Text>
          <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.dimButton,
                  n <= (scores[dim.key] || 0) && styles.dimActive,
                ]}
                onPress={() => setScores({ ...scores, [dim.key]: n })}
              >
                <Text
                  style={[
                    styles.dimText,
                    n <= (scores[dim.key] || 0) && styles.dimTextActive,
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Comment */}
      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        style={styles.textarea}
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience..."
        multiline
        numberOfLines={3}
      />

      {/* Public */}
      <View style={styles.publicRow}>
        <Text style={styles.publicLabel}>Make rating public</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.primaryButton, overallScore === 0 && styles.disabled]}
        disabled={overallScore === 0 || isLoading}
        onPress={handleSubmit}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit Evaluation</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace('/(tabs)/sessions')}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 20 },
  checkmark: { fontSize: 48, color: '#22c55e', marginBottom: 16 },
  thankTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  thankText: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  scoreRow: { flexDirection: 'row', gap: 8 },
  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreActive: { backgroundColor: '#eab308' },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#9ca3af' },
  scoreTextActive: { color: '#000' },
  dimSection: { marginTop: 16 },
  dimLabel: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 6 },
  dimButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimActive: { backgroundColor: '#2563eb' },
  dimText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  dimTextActive: { color: '#fff' },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  publicLabel: { fontSize: 14, color: '#4b5563' },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  skipText: { color: '#6b7280', fontSize: 14 },
});
