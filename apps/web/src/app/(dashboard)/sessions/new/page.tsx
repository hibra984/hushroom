'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api-client';

const SESSION_TYPES = {
  FOCUS: {
    label: 'Focus',
    description: 'Stay focused on a specific task with accountability and presence.',
    defaultDuration: 30,
  },
  DECISION: {
    label: 'Decision',
    description: 'Work through a decision with structured support and clear options.',
    defaultDuration: 45,
  },
  EMOTIONAL_UNLOAD: {
    label: 'Emotional Unload',
    description: 'Express and process emotions in a safe, structured, non-therapeutic setting.',
    defaultDuration: 30,
  },
  PLANNING: {
    label: 'Planning',
    description: 'Plan and organize with structured accountability and actionable outcomes.',
    defaultDuration: 60,
  },
} as const;

type SessionTypeKey = keyof typeof SESSION_TYPES;

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  sessionType: string;
  mode: string;
  rules: { type: string; description?: string }[];
}

interface MatchResult {
  companionId: string;
  displayName: string | null;
  avatarUrl: string | null;
  type: string;
  bio: string | null;
  baseRate: number;
  expertiseTags: string[];
  averageRating: number;
  reputationScore: number;
  totalSessions: number;
  successRate: number;
  isOnline: boolean;
  languages: { language: string; proficiency: string }[];
  score: number;
  breakdown: {
    goalMatch: number;
    reputation: number;
    fairDistribution: number;
    priceFit: number;
  };
}

export default function NewSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Session type
  const [sessionType, setSessionType] = useState<SessionTypeKey | null>(null);
  const [plannedDuration, setPlannedDuration] = useState(30);

  // Step 2: Goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState(['']);

  // Step 3: Contract
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 4: Matching
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const handleSelectType = (type: SessionTypeKey) => {
    setSessionType(type);
    setPlannedDuration(SESSION_TYPES[type].defaultDuration);
  };

  const goToStep2 = () => {
    if (!sessionType) return;
    setStep(2);
  };

  const goToStep3 = async () => {
    if (!goalTitle || !goalDescription || !successCriteria.filter(Boolean).length) return;
    setError('');
    try {
      const res = await apiClient.get<ContractTemplate[]>(
        `/contracts/templates?sessionType=${sessionType}`,
      );
      setTemplates(res);
      setStep(3);
    } catch {
      setTemplates([]);
      setStep(3);
    }
  };

  const goToStep4 = async () => {
    if (!sessionType) return;
    setIsLoading(true);
    setError('');
    try {
      // Create session, goal, contract
      const session = await apiClient.post<{ id: string }>('/sessions', {
        type: sessionType,
        plannedDuration,
      });
      const sid = session.id;
      setSessionId(sid);

      await apiClient.post('/goals', {
        sessionId: sid,
        title: goalTitle,
        description: goalDescription,
        successCriteria: successCriteria.filter(Boolean),
      });

      const template = templates.find((t) => t.id === selectedTemplate);
      await apiClient.post('/contracts', {
        sessionId: sid,
        templateId: selectedTemplate || undefined,
        mode: template?.mode || 'MODERATE',
      });

      // Find matches
      setMatchingLoading(true);
      const matches = await apiClient.post<MatchResult[]>('/matching/find', {
        sessionId: sid,
      });
      setMatchResults(matches);
      setMatchingLoading(false);

      setStep(4);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompanion = async () => {
    if (!sessionId || !selectedCompanion) return;
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/matching/select', {
        sessionId,
        companionId: selectedCompanion,
      });
      setStep(5);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to select companion');
    } finally {
      setIsLoading(false);
    }
  };

  const skipMatching = () => {
    setStep(5);
  };

  const addCriteria = () => setSuccessCriteria([...successCriteria, '']);
  const updateCriteria = (index: number, value: string) => {
    const updated = [...successCriteria];
    updated[index] = value;
    setSuccessCriteria(updated);
  };
  const removeCriteria = (index: number) => {
    if (successCriteria.length <= 1) return;
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-6">
      <h1 className="mb-2 text-3xl font-bold">Book a New Session</h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">
        Build the session in steps, then choose the best companion match.
      </p>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#0f7e5f]' : 'bg-[#d7e4db]'}`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">What kind of session?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(SESSION_TYPES) as SessionTypeKey[]).map((key) => {
              const t = SESSION_TYPES[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSelectType(key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    sessionType === key
                      ? 'border-[#42a889] bg-[#ecf9f3]'
                      : 'border-[#d4e2d9] bg-white hover:border-[#b9cec2]'
                  }`}
                >
                  <div className="mb-1 text-sm font-semibold">{t.label}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{t.description}</div>
                  <div className="mt-2 text-xs text-[var(--ink-soft)]">{t.defaultDuration} min default</div>
                </button>
              );
            })}
          </div>

          {sessionType && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-[#325145]">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(Number(e.target.value))}
                className="input-field w-32 text-sm"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={goToStep2}
              disabled={!sessionType}
              className="btn-primary rounded-xl px-6 py-2 text-sm disabled:opacity-50"
            >
              Next: Define Goal
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Define goal */}
      {step === 2 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Define your goal</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#325145]">Goal Title</label>
              <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Finish quarterly report draft"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#325145]">Description</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Describe what you want to accomplish..."
                rows={3}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#325145]">
                Success Criteria
              </label>
              {successCriteria.map((c, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={c}
                    onChange={(e) => updateCriteria(i, e.target.value)}
                    placeholder={`Criterion ${i + 1}`}
                    className="input-field flex-1 text-sm"
                  />
                  {successCriteria.length > 1 && (
                    <button
                      onClick={() => removeCriteria(i)}
                      className="text-sm font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addCriteria}
                className="text-sm font-semibold text-[#0f7a5b] hover:text-[#0a6047]"
              >
                + Add criterion
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary rounded-xl px-6 py-2 text-sm"
            >
              Back
            </button>
            <button
              onClick={goToStep3}
              disabled={!goalTitle || !goalDescription || !successCriteria.filter(Boolean).length}
              className="btn-primary rounded-xl px-6 py-2 text-sm disabled:opacity-50"
            >
              Next: Choose Contract
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose contract */}
      {step === 3 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Choose a behavioral contract</h2>
          <p className="mb-4 text-sm text-[var(--ink-soft)]">
            Contracts define the rules of engagement for your session.
          </p>

          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedTemplate === t.id
                    ? 'border-[#42a889] bg-[#ecf9f3]'
                    : 'border-[#d4e2d9] bg-white hover:border-[#b9cec2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-xs text-[#35557d]">
                    {t.mode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.rules.map((r, i) => (
                    <span
                      key={i}
                      className="rounded bg-[#edf5f0] px-1.5 py-0.5 text-xs text-[#4f675b]"
                    >
                      {r.description || r.type}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-[var(--ink-soft)]">No templates available. A default contract will be used.</p>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary rounded-xl px-6 py-2 text-sm"
            >
              Back
            </button>
            <button
              onClick={goToStep4}
              disabled={isLoading}
              className="btn-primary rounded-xl px-6 py-2 text-sm disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Next: Find Companion'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Find companion */}
      {step === 4 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Choose a companion</h2>
          <p className="mb-4 text-sm text-[var(--ink-soft)]">
            We found companions that match your session. Select one to proceed.
          </p>

          {matchingLoading ? (
            <p className="text-sm text-[var(--ink-soft)]">Finding companions...</p>
          ) : matchResults.length === 0 ? (
            <div className="surface-card rounded-2xl p-6 text-center">
              <p className="mb-4 text-sm text-[var(--ink-soft)]">
                No companions available right now. Your session has been created and will be matched automatically.
              </p>
              <button
                onClick={skipMatching}
                className="btn-primary rounded-xl px-4 py-2 text-sm"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {matchResults.map((match) => (
                  <button
                    key={match.companionId}
                    onClick={() => setSelectedCompanion(match.companionId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedCompanion === match.companionId
                        ? 'border-[#42a889] bg-[#ecf9f3]'
                        : 'border-[#d4e2d9] bg-white hover:border-[#b9cec2]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {match.displayName || 'Companion'}
                          </span>
                          {match.isOnline && (
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                          )}
                          <span className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-xs text-[#35557d]">
                            {match.type}
                          </span>
                        </div>
                        {match.bio && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-soft)]">{match.bio}</p>
                        )}
                        {match.expertiseTags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.expertiseTags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-[#edf5f0] px-1.5 py-0.5 text-xs text-[#4f675b]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(match.score * 100)}%
                        </div>
                        <div className="text-xs text-gray-400">match</div>
                        <div className="mt-1 text-xs text-[var(--ink-soft)]">
                          {match.averageRating.toFixed(1)} rating
                        </div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {match.baseRate} EUR/session
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={skipMatching}
                  className="btn-secondary rounded-xl px-6 py-2 text-sm"
                >
                  Skip (auto-match later)
                </button>
                <button
                  onClick={handleSelectCompanion}
                  disabled={!selectedCompanion || isLoading}
                  className="btn-primary rounded-xl px-6 py-2 text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Selecting...' : 'Select Companion'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && sessionId && (
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold text-[#0f7a5b]">Session Created</h2>
          <p className="mb-6 text-sm text-[var(--ink-soft)]">
            {selectedCompanion
              ? 'Your session has been created and matched with a companion.'
              : 'Your session has been created. It will be matched with a companion shortly.'}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/sessions"
              className="btn-secondary rounded-xl px-4 py-2 text-sm"
            >
              View All Sessions
            </Link>
            <Link
              href={`/sessions/${sessionId}`}
              className="btn-primary rounded-xl px-4 py-2 text-sm"
            >
              View Session
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
