'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface CompanionProfile {
  id: string;
  type: string;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  totalSessions: number;
  successRate: number;
  averageRating: number;
  reputationScore: number;
  driftEnforcement: string;
  isOnline: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  languages: { language: string; proficiency: string }[];
}

export default function CompanionDetailPage() {
  const params = useParams();
  const companionId = params.id as string;
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<CompanionProfile>(`/companions/${companionId}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [companionId]);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-red-600">Companion not found.</p>
        <Link href="/companions" className="text-sm text-blue-600 hover:underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link href="/companions" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        &larr; Back to Companions
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {profile.displayName || 'Companion'}
              </h1>
              {profile.isOnline && (
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {profile.type}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {profile.driftEnforcement} enforcement
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{profile.averageRating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">rating</div>
          </div>
        </div>

        {profile.bio && (
          <p className="mb-6 text-sm text-gray-600">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold">{profile.totalSessions}</div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold">{profile.successRate}%</div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold">{profile.reputationScore.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Reputation</div>
          </div>
        </div>

        {/* Expertise */}
        {profile.expertiseTags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile.expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {profile.languages.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((l) => (
                <span
                  key={l.language}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                >
                  {l.language} ({l.proficiency})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Pricing</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{profile.baseRate} EUR</span>
            <span className="text-sm text-gray-500">/ session</span>
          </div>
          {profile.expertPremium && Number(profile.expertPremium) > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              +{profile.expertPremium} EUR expert premium
            </div>
          )}
        </div>

        <Link
          href="/sessions/new"
          className="block rounded-md bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Book a Session
        </Link>
      </div>
    </div>
  );
}
