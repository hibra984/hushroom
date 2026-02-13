'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

type Step = 'welcome' | 'profile' | 'role' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, initialize } = useAuthStore();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    displayName: user?.firstName || '',
    preferredLanguage: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [role, setRole] = useState<'user' | 'companion'>('user');
  const [companionData, setCompanionData] = useState({
    bio: '',
    type: 'PEER',
    baseRate: '20',
    specialties: [] as string[],
  });

  const availableSpecialties = [
    'ACADEMIC', 'FITNESS', 'CREATIVE', 'WRITING', 'FOCUS',
    'HABITS', 'WELLNESS', 'CAREER', 'MEDITATION', 'STUDY',
  ];

  const toggleSpecialty = (s: string) => {
    setCompanionData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s],
    }));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await apiClient.patch('/users/me', {
        displayName: profile.displayName,
        preferredLanguage: profile.preferredLanguage,
        timezone: profile.timezone,
      });
      setStep('role');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      if (role === 'companion') {
        await apiClient.post('/companions/register', {
          bio: companionData.bio,
          type: companionData.type,
          baseRate: parseFloat(companionData.baseRate),
          specialties: companionData.specialties,
        });
      }
      initialize();
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Progress indicator */}
        <div className="mb-8 flex gap-2">
          {['welcome', 'profile', 'role', 'complete'].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                ['welcome', 'profile', 'role', 'complete'].indexOf(step) >= i
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 'welcome' && (
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Welcome to Hushroom</h1>
            <p className="mb-2 text-gray-600">
              Your journey to structured human presence starts here.
            </p>
            <p className="mb-8 text-sm text-gray-400">
              Let's set up your profile so you can start booking sessions with trained companions.
            </p>
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 p-4 text-left">
                <h3 className="font-semibold text-blue-900">1. Set your goal</h3>
                <p className="text-sm text-blue-700">Define what you want to accomplish</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-left">
                <h3 className="font-semibold text-blue-900">2. Find a companion</h3>
                <p className="text-sm text-blue-700">AI matches you with the perfect presence partner</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-left">
                <h3 className="font-semibold text-blue-900">3. Stay present</h3>
                <p className="text-sm text-blue-700">Real-time audio sessions with drift detection</p>
              </div>
            </div>
            <button
              onClick={() => setStep('profile')}
              className="mt-8 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              Let's get started
            </button>
          </div>
        )}

        {step === 'profile' && (
          <div>
            <h2 className="mb-6 text-xl font-bold">Your Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="How should others see you?"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={profile.preferredLanguage}
                  onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="fr">Fran\u00e7ais</option>
                  <option value="ar">\u0627\u0644\u0639\u0631\u0628\u064a\u0629</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
                <input
                  type="text"
                  value={profile.timezone}
                  readOnly
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-400">Auto-detected from your browser</p>
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={loading || !profile.displayName}
              className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'role' && (
          <div>
            <h2 className="mb-2 text-xl font-bold">How will you use Hushroom?</h2>
            <p className="mb-6 text-sm text-gray-500">You can always change this later.</p>
            <div className="space-y-3">
              <button
                onClick={() => { setRole('user'); setStep('complete'); }}
                className={`w-full rounded-lg border-2 p-4 text-left transition ${
                  role === 'user' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold">I need a companion</h3>
                <p className="text-sm text-gray-500">
                  Book sessions with trained presence companions to stay accountable and achieve your goals.
                </p>
              </button>
              <button
                onClick={() => setRole('companion')}
                className={`w-full rounded-lg border-2 p-4 text-left transition ${
                  role === 'companion' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold">I want to be a companion</h3>
                <p className="text-sm text-gray-500">
                  Earn by providing structured human presence. Help others achieve their goals.
                </p>
              </button>
            </div>

            {role === 'companion' && (
              <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={companionData.bio}
                    onChange={(e) => setCompanionData({ ...companionData, bio: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe your experience and what you offer..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={companionData.type}
                      onChange={(e) => setCompanionData({ ...companionData, type: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="PEER">Peer Companion</option>
                      <option value="PROFESSIONAL">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hourly Rate (\u20AC)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={companionData.baseRate}
                      onChange={(e) => setCompanionData({ ...companionData, baseRate: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSpecialties.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSpecialty(s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          companionData.specialties.includes(s)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep('complete')}
                  disabled={!companionData.bio || companionData.specialties.length === 0}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl text-green-600">&#10003;</span>
            </div>
            <h2 className="mb-2 text-xl font-bold">You're all set!</h2>
            <p className="mb-6 text-gray-500">
              {role === 'companion'
                ? 'Your companion application has been submitted. You\'ll be notified once approved.'
                : 'Your profile is ready. Time to book your first session!'}
            </p>
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
