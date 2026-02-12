import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
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

export default function NewSessionScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [sessionType, setSessionType] = useState<string | null>(null);
  const [plannedDuration, setPlannedDuration] = useState(30);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState(['']);

  const addCriteria = () => setSuccessCriteria([...successCriteria, '']);
  const updateCriteria = (index: number, value: string) => {
    const updated = [...successCriteria];
    updated[index] = value;
    setSuccessCriteria(updated);
  };

  const handleSubmit = async () => {
    if (!sessionType) return;
    setIsLoading(true);
    try {
      const session = await apiClient.post<{ id: string }>('/sessions', {
        type: sessionType,
        plannedDuration,
      });

      await apiClient.post('/goals', {
        sessionId: session.id,
        title: goalTitle,
        description: goalDescription,
        successCriteria: successCriteria.filter(Boolean),
      });

      await apiClient.post('/contracts', {
        sessionId: session.id,
        mode: 'MODERATE',
      });

      Alert.alert('Session Created', 'Your session has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to create session';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progress}>
        {[1, 2].map((s) => (
          <View
            key={s}
            style={[styles.progressBar, { backgroundColor: s <= step ? '#2563eb' : '#e5e7eb' }]}
          />
        ))}
      </View>

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
              onPress={handleSubmit}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Session</Text>
              )}
            </TouchableOpacity>
          </View>
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
});
