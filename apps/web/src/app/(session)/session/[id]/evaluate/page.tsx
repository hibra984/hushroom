'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

const DIMENSIONS = [
  { key: 'goalAchievement', label: 'Goal Achievement', desc: 'How well was the session goal met?' },
  { key: 'presenceQuality', label: 'Presence Quality', desc: 'Quality of human presence and attention.' },
  { key: 'contractAdherence', label: 'Contract Adherence', desc: 'How well were session rules followed?' },
  { key: 'communication', label: 'Communication', desc: 'Clarity and helpfulness of communication.' },
];

export default function EvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-5xl text-green-400">&#10003;</div>
          <h1 className="mb-2 text-2xl font-bold">Thank You!</h1>
          <p className="mb-6 text-gray-400">Your evaluation has been submitted.</p>
          <button
            onClick={() => router.push('/sessions')}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-2xl font-bold">Rate Your Session</h1>
        <p className="mb-8 text-gray-400">Your feedback helps improve the platform.</p>

        {/* Overall Score */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Overall Score
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setOverallScore(n)}
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold transition ${
                  n <= overallScore
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Scores */}
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} className="mb-6">
            <label className="mb-1 block text-sm font-semibold text-gray-300">
              {dim.label}
            </label>
            <p className="mb-2 text-xs text-gray-500">{dim.desc}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScores({ ...scores, [dim.key]: n })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition ${
                    n <= (scores[dim.key] || 0)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Comment */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-300">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-sm text-white placeholder-gray-500"
            rows={3}
            placeholder="Share your experience..."
          />
        </div>

        {/* Public toggle */}
        <label className="mb-8 flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600"
          />
          <span className="text-sm text-gray-400">Make this rating public</span>
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={overallScore === 0 || isLoading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Evaluation'}
        </button>

        <button
          onClick={() => router.push('/sessions')}
          className="mt-4 w-full rounded-lg border border-gray-600 py-3 text-sm text-gray-400 transition hover:bg-gray-800"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
