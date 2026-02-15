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
        <p className="text-sm text-[var(--ink-soft)]">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-red-600">Companion not found.</p>
        <Link href="/companions" className="text-sm font-semibold text-[#0e7a5a] hover:text-[#0a6047]">
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-6">
      <Link href="/companions" className="mb-4 inline-block text-sm font-semibold text-[#0e7a5a] hover:text-[#0a6047]">
        {'<-'} Back to Companions
      </Link>

      <div className="surface-card rounded-3xl p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {profile.displayName || 'Companion'}
              </h1>
              {profile.isOnline && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#1ba479]" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-[#e6f5ee] px-2 py-0.5 text-xs font-semibold text-[#0f6f54]">
                {profile.type}
              </span>
              <span className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-xs font-semibold text-[#35557d]">
                {profile.driftEnforcement} enforcement
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#123d2d]">{profile.averageRating.toFixed(1)}</div>
            <div className="text-xs text-[var(--ink-soft)]">rating</div>
          </div>
        </div>

        {profile.bio && (
          <p className="mb-6 text-sm text-[var(--ink-soft)]">{profile.bio}</p>
        )}

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#f2f8f4] p-3 text-center">
            <div className="text-lg font-bold">{profile.totalSessions}</div>
            <div className="text-xs text-[var(--ink-soft)]">Sessions</div>
          </div>
          <div className="rounded-2xl bg-[#f2f8f4] p-3 text-center">
            <div className="text-lg font-bold">{profile.successRate}%</div>
            <div className="text-xs text-[var(--ink-soft)]">Success</div>
          </div>
          <div className="rounded-2xl bg-[#f2f8f4] p-3 text-center">
            <div className="text-lg font-bold">{profile.reputationScore.toFixed(0)}</div>
            <div className="text-xs text-[var(--ink-soft)]">Reputation</div>
          </div>
        </div>

        {profile.expertiseTags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-[#355145]">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile.expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#eaf4ff] px-3 py-1 text-xs font-semibold text-[#265b86]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.languages.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-[#355145]">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((l) => (
                <span
                  key={l.language}
                  className="rounded-full bg-[#f0f4f1] px-3 py-1 text-xs text-[#4c6258]"
                >
                  {l.language} ({l.proficiency})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-2xl bg-[#f2f8f4] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#355145]">Pricing</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#154a38]">{profile.baseRate} EUR</span>
            <span className="text-sm text-[var(--ink-soft)]">/ session</span>
          </div>
          {profile.expertPremium && Number(profile.expertPremium) > 0 && (
            <div className="mt-1 text-xs text-[var(--ink-soft)]">
              +{profile.expertPremium} EUR expert premium
            </div>
          )}
        </div>

        <Link
          href="/sessions/new"
          className="btn-primary block rounded-xl px-6 py-3 text-center text-sm"
        >
          Book a Session
        </Link>
      </div>
    </div>
  );
}
