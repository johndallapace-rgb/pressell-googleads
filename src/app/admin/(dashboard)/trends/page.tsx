'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/FormInput';
import type { AdminTrendItem, AdminTrendsSnapshot } from '@/lib/admin/trends-types';

const EMPTY_SNAPSHOT: AdminTrendsSnapshot = {
  state: 'empty',
  items: [],
  last_updated: null,
  source_status: {
    search: {
      configured: false,
      used: false,
      provider: 'none',
      detail: 'Missing configuration',
      errors: [],
    },
    gemini: {
      configured: false,
      used: false,
      provider: 'none',
      detail: 'Missing configuration',
      errors: [],
    },
  },
  errors: [],
};

function formatTimestamp(value: string | null) {
  if (!value) return 'Not refreshed yet';

  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusClasses(status: AdminTrendItem['status']) {
  if (status === 'rising') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'stable') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'declining') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function scoreClasses(score: number) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-500';
}

function sourceLabel(snapshot: AdminTrendsSnapshot) {
  if (!snapshot.source_status.search.configured) return 'Missing configuration';
  if (snapshot.source_status.search.used) {
    return snapshot.source_status.search.provider === 'serpapi' ? 'Real search signals via SerpApi' : 'Real search signals via Google Custom Search';
  }
  return 'Configured, refresh to collect real search signals';
}

function geminiLabel(snapshot: AdminTrendsSnapshot) {
  if (!snapshot.source_status.gemini.configured) return 'Missing configuration';
  if (snapshot.source_status.gemini.used) return 'AI analyzed with Gemini';
  return 'Gemini available, heuristic analysis active';
}

function filterTrendItems(items: AdminTrendItem[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.niche,
      item.source,
      item.search_intent,
      item.summary,
      ...item.suggested_keywords,
      ...item.detected_angles,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export default function MarketTrendsPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AdminTrendsSnapshot>(EMPTY_SNAPSHOT);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const filteredItems = useMemo(() => filterTrendItems(snapshot.items, searchQuery), [snapshot.items, searchQuery]);
  const featuredItems = useMemo(() => filteredItems.slice(0, 4), [filteredItems]);

  async function loadSnapshot() {
    setRequestError(null);

    const response = await fetch('/api/admin/trends', {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load trends snapshot');
    }

    setSnapshot(data as AdminTrendsSnapshot);
  }

  useEffect(() => {
    loadSnapshot()
      .catch((error) => setRequestError(error instanceof Error ? error.message : 'Failed to load trends snapshot'))
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleRefreshAnalysis() {
    setRefreshing(true);
    setRequestError(null);

    try {
      const response = await fetch('/api/admin/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to refresh trends snapshot');
      }

      setSnapshot(data as AdminTrendsSnapshot);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to refresh trends snapshot');
    } finally {
      setRefreshing(false);
    }
  }

  function handleCreatePresell(item: AdminTrendItem) {
    const params = new URLSearchParams({
      name: item.title,
      niche: item.niche,
    });

    if (item.evidence_urls[0]) {
      params.set('url', item.evidence_urls[0]);
    }

    router.push(`/admin/products/new?${params.toString()}`);
  }

  const showEmptyState = !initialLoading && !requestError && filteredItems.length === 0;
  const showNoSearchResults = showEmptyState && snapshot.items.length > 0 && searchQuery.trim().length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Market Trends & Intelligence</h1>
          <p className="mt-1 text-gray-600">
            Backend-backed trend intelligence using real search signals, optional Gemini analysis, and persisted snapshots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-500 opacity-70"
          >
            Auto-Deploy Winners: Coming soon
          </button>

          <button
            type="button"
            onClick={handleRefreshAnalysis}
            disabled={refreshing}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {refreshing ? 'Refreshing analysis...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Real Search Signals</p>
          <p className="mt-2 text-sm font-semibold text-gray-800">{sourceLabel(snapshot)}</p>
          <p className="mt-2 text-xs text-gray-500">{snapshot.source_status.search.detail}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">AI Analyzed</p>
          <p className="mt-2 text-sm font-semibold text-gray-800">{geminiLabel(snapshot)}</p>
          <p className="mt-2 text-xs text-gray-500">{snapshot.source_status.gemini.detail}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Updated</p>
          <p className="mt-2 text-sm font-semibold text-gray-800">{formatTimestamp(snapshot.last_updated)}</p>
          <p className="mt-2 text-xs text-gray-500">
            {snapshot.items.length ? `${snapshot.items.length} persisted trend items available` : 'No persisted trend items yet'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Snapshot State</p>
          <p className="mt-2 text-sm font-semibold capitalize text-gray-800">{snapshot.state.replace('_', ' ')}</p>
          <p className="mt-2 text-xs text-gray-500">
            {snapshot.state === 'setup_required'
              ? 'Missing configuration'
              : snapshot.state === 'error'
                ? 'Refresh returned one or more errors'
                : snapshot.state === 'ready'
                  ? 'Real trend data available'
                  : 'Run a refresh to create the first snapshot'}
          </p>
        </div>
      </section>

      {requestError && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Unable to load Trends data</p>
              <p className="text-sm">{requestError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setInitialLoading(true);
                loadSnapshot()
                  .catch((error) => setRequestError(error instanceof Error ? error.message : 'Failed to load trends snapshot'))
                  .finally(() => setInitialLoading(false));
              }}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              Retry
            </button>
          </div>
        </section>
      )}

      {!requestError && snapshot.state === 'setup_required' && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Setup required</p>
              <p className="text-sm">
                Configure SerpApi or Google Custom Search to collect real signals. Configure Gemini if you want AI enrichment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin/config')}
              className="rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-semibold text-yellow-800"
            >
              Open Config
            </button>
          </div>
        </section>
      )}

      {!requestError && snapshot.errors.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Refresh Notes</h2>
              <p className="text-sm text-gray-500">Partial failures and configuration issues captured during the latest snapshot run.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {snapshot.errors.length} issue{snapshot.errors.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {snapshot.errors.slice(0, 8).map((error) => (
              <div key={error} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                {error}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Featured Opportunities</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ranked by opportunity score from the latest persisted snapshot.
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <FormInput
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search trends, niches, keywords..."
            />
          </div>
        </div>

        {initialLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    <p className="mt-1 text-sm capitalize text-gray-500">{item.niche}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold capitalize ${getStatusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">{item.summary}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Opportunity</p>
                    <p className={`mt-1 text-lg font-bold ${scoreClasses(item.opportunity_score)}`}>{item.opportunity_score}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Competition</p>
                    <p className={`mt-1 text-lg font-bold ${scoreClasses(100 - item.competition_score)}`}>{item.competition_score}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.suggested_keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {keyword}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleCreatePresell(item)}
                  className="mt-5 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white"
                >
                  Create Pre-sell From Trend
                </button>
              </article>
            ))}
          </div>
        )}

        {showEmptyState && (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
            {showNoSearchResults
              ? `No trends matched "${searchQuery}".`
              : snapshot.state === 'setup_required'
                ? 'Missing configuration. Add a search provider, then refresh analysis.'
                : snapshot.state === 'empty'
                  ? 'No trend snapshot exists yet. Run Refresh Analysis to generate one.'
                  : 'No trend data is available right now.'}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-800">Full Trend List</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search intent, scoring, and evidence links from the persisted backend snapshot.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-6 py-4">Trend</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Scores</th>
                <th className="px-6 py-4">Signals</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="align-top transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${getStatusClasses(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded bg-gray-100 px-2 py-1 capitalize">{item.niche}</span>
                        <span className="rounded bg-gray-100 px-2 py-1">{item.search_intent}</span>
                      </div>
                      <p className="max-w-xl text-sm text-gray-600">{item.summary}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-800">{item.source}</div>
                      <div className="text-xs text-gray-500">{formatTimestamp(item.last_updated)}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="grid min-w-[180px] grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Trend</p>
                        <p className={`font-bold ${scoreClasses(item.trend_score)}`}>{item.trend_score}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Opportunity</p>
                        <p className={`font-bold ${scoreClasses(item.opportunity_score)}`}>{item.opportunity_score}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Competition</p>
                        <p className="font-bold text-gray-700">{item.competition_score}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Risk</p>
                        <p className="font-bold text-gray-700">{item.risk_score}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {item.detected_angles.slice(0, 3).map((angle) => (
                          <span key={angle} className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                            {angle}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.suggested_keywords.slice(0, 4).map((keyword) => (
                          <span key={keyword} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        {item.evidence_urls.slice(0, 2).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-blue-600 hover:text-blue-800"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleCreatePresell(item)}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:border-blue-400 hover:text-blue-800"
                    >
                      Create Pre-sell
                    </button>
                  </td>
                </tr>
              ))}

              {showEmptyState && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    {showNoSearchResults
                      ? `No results matched "${searchQuery}".`
                      : 'No trend items available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
