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
    icon: 'O',
  },
  DECISION: {
    label: 'Decision',
    description: 'Work through a decision with structured support and clear options.',
    defaultDuration: 45,
    icon: 'D',
  },
  EMOTIONAL_UNLOAD: {
    label: 'Emotional Unload',
    description: 'Express and process emotions in a safe, structured, non-therapeutic setting.',
    defaultDuration: 30,
    icon: 'E',
  },
  PLANNING: {
    label: 'Planning',
    description: 'Plan and organize with structured accountability and actionable outcomes.',
    defaultDuration: 60,
    icon: 'P',
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

  // Step 4: Session ID after creation
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!sessionType) return;
    setIsLoading(true);
    setError('');
    try {
      // Create session
      const session = await apiClient.post<{ id: string }>('/sessions', {
        type: sessionType,
        plannedDuration,
      });
      const sid = session.id;
      setSessionId(sid);

      // Create goal
      await apiClient.post('/goals', {
        sessionId: sid,
        title: goalTitle,
        description: goalDescription,
        successCriteria: successCriteria.filter(Boolean),
      });

      // Create contract
      const template = templates.find((t) => t.id === selectedTemplate);
      await apiClient.post('/contracts', {
        sessionId: sid,
        templateId: selectedTemplate || undefined,
        mode: template?.mode || 'MODERATE',
      });

      setStep(4);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
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
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-2 text-2xl font-bold">Book a New Session</h1>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
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
                  className={`rounded-lg border p-4 text-left transition ${
                    sessionType === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1 text-sm font-semibold">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                  <div className="mt-2 text-xs text-gray-400">{t.defaultDuration} min default</div>
                </button>
              );
            })}
          </div>

          {sessionType && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={goToStep2}
              disabled={!sessionType}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Goal Title</label>
              <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Finish quarterly report draft"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Describe what you want to accomplish..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Success Criteria
              </label>
              {successCriteria.map((c, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={c}
                    onChange={(e) => updateCriteria(i, e.target.value)}
                    placeholder={`Criterion ${i + 1}`}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  {successCriteria.length > 1 && (
                    <button
                      onClick={() => removeCriteria(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addCriteria}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add criterion
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={goToStep3}
              disabled={!goalTitle || !goalDescription || !successCriteria.filter(Boolean).length}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
          <p className="mb-4 text-sm text-gray-500">
            Contracts define the rules of engagement for your session.
          </p>

          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedTemplate === t.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {t.mode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.rules.map((r, i) => (
                    <span
                      key={i}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                    >
                      {r.description || r.type}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-gray-400">No templates available. A default contract will be used.</p>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && sessionId && (
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold text-green-700">Session Created</h2>
          <p className="mb-6 text-sm text-gray-600">
            Your session has been created. It will be matched with a companion shortly.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/sessions`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View All Sessions
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
