'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Companion {
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
  isOnline: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  languages: { language: string; proficiency: string }[];
}

interface SearchResponse {
  data: Companion[];
  total: number;
  take: number;
  skip: number;
}

export default function CompanionsPage() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [searchTag, setSearchTag] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (onlineOnly) params.set('isOnline', 'true');
    if (searchTag) params.set('expertiseTag', searchTag);
    const qs = params.toString();

    apiClient
      .get<SearchResponse>(`/companions${qs ? `?${qs}` : ''}`)
      .then((res) => {
        setCompanions(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        setCompanions([]);
        setTotal(0);
      })
      .finally(() => setIsLoading(false));
  }, [onlineOnly, searchTag]);

  return (
    <div className="py-2 sm:py-4">
      <h1 className="text-3xl font-bold">Browse Companions</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Find a partner whose expertise and pace match your goals.
      </p>

      <div className="glass-shell mt-6 flex flex-wrap items-center gap-4 rounded-2xl p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="h-4 w-4 rounded border-[#b5cabd]"
          />
          Online only
        </label>
        <input
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          placeholder="Filter by expertise..."
          className="input-field max-w-sm text-sm"
        />
        <span className="text-xs font-medium text-[var(--ink-soft)]">
          {total} companion{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">Loading companions...</p>
      ) : companions.length === 0 ? (
        <div className="surface-card mt-6 rounded-2xl p-8 text-center">
          <p className="text-[var(--ink-soft)]">No companions found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companions.map((c) => (
            <Link
              key={c.id}
              href={`/companions/${c.id}`}
              className="surface-card card-lift rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#153227]">
                      {c.displayName || 'Companion'}
                    </span>
                    {c.isOnline && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#19a175]" />
                    )}
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-[#e6f5ee] px-2 py-0.5 text-[11px] font-semibold text-[#0f7054]">
                    {c.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#12382a]">{Number(c.averageRating || 0).toFixed(1)}</div>
                  <div className="text-xs text-[var(--ink-soft)]">rating</div>
                </div>
              </div>

              {c.bio && (
                <p className="mb-3 line-clamp-2 text-xs text-[var(--ink-soft)]">{c.bio}</p>
              )}

              {c.expertiseTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {c.expertiseTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#eaf4ff] px-1.5 py-0.5 text-xs text-[#265b86]"
                    >
                      {tag}
                    </span>
                  ))}
                  {c.expertiseTags.length > 3 && (
                    <span className="text-xs text-[var(--ink-soft)]">+{c.expertiseTags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#e0ebe3] pt-3 text-xs text-[var(--ink-soft)]">
                <span>{c.totalSessions} sessions</span>
                <span>{c.successRate}% success</span>
                <span className="font-semibold text-[#154b38]">{Number(c.baseRate || 0).toFixed(0)} EUR</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
