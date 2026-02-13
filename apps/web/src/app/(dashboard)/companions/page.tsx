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
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">Browse Companions</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="rounded"
          />
          Online only
        </label>
        <input
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          placeholder="Filter by expertise..."
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <span className="text-xs text-gray-500">{total} companion{total !== 1 ? 's' : ''} found</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading companions...</p>
      ) : companions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No companions found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companions.map((c) => (
            <Link
              key={c.id}
              href={`/companions/${c.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {c.displayName || 'Companion'}
                    </span>
                    {c.isOnline && (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{c.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{c.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">rating</div>
                </div>
              </div>

              {c.bio && (
                <p className="mb-3 text-xs text-gray-600 line-clamp-2">{c.bio}</p>
              )}

              {c.expertiseTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {c.expertiseTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {c.expertiseTags.length > 3 && (
                    <span className="text-xs text-gray-400">+{c.expertiseTags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>{c.totalSessions} sessions</span>
                <span>{c.successRate}% success</span>
                <span>{c.baseRate} EUR</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
