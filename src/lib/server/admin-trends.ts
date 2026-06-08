import 'server-only';

import { generateContent } from '@/lib/gemini';
import { AdminTrendItem, AdminTrendsSnapshot } from '@/lib/admin/trends-types';
import { getSystemConfig } from '@/lib/server/config';
import { kvCache } from '@/lib/server/kv-cache';

const SNAPSHOT_KEY = 'admin_trends_snapshot_v1';
const SNAPSHOT_NAMESPACE = 'admin_trends';
const DEFAULT_NICHES = ['health', 'fitness', 'finance', 'software', 'survival', 'diy', 'beauty', 'pets'] as const;

type SearchProvider = 'serpapi' | 'google_custom_search' | 'none';

interface SearchSignal {
  title: string;
  snippet: string;
  url: string;
}

interface SearchCollectionResult {
  provider: SearchProvider;
  query: string;
  signals: SearchSignal[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function uniqStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildQuery(niche: string) {
  const queryMap: Record<string, string> = {
    health: 'best health products 2026',
    fitness: 'fitness trends 2026 products',
    finance: 'personal finance software trends 2026',
    software: 'best software tools 2026',
    survival: 'survival gear trends 2026',
    diy: 'best diy products 2026',
    beauty: 'beauty trends 2026 products',
    pets: 'pet products trends 2026',
  };

  return queryMap[niche] || `${niche} trends 2026`;
}

function cleanTitle(title: string) {
  return title.replace(/\s*[-|:]\s*[^-|:]+$/, '').trim();
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function extractKeywords(signals: SearchSignal[]) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'your',
    '2026',
    'best',
    'top',
    'how',
    'you',
    'are',
    'our',
    'into',
    'products',
    'product',
    'trends',
    'trend',
    'guide',
    'review',
  ]);

  const counts = new Map<string, number>();

  for (const signal of signals) {
    for (const token of tokenize(`${signal.title} ${signal.snippet}`)) {
      if (token.length < 4 || stopWords.has(token)) continue;
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([token]) => token);
}

function inferAngles(signals: SearchSignal[]) {
  const joined = `${signals.map((signal) => `${signal.title} ${signal.snippet}`).join(' ')}`.toLowerCase();
  const angles: string[] = [];

  if (joined.includes('ai')) angles.push('AI-assisted');
  if (joined.includes('subscription') || joined.includes('saas')) angles.push('Recurring revenue');
  if (joined.includes('natural') || joined.includes('supplement')) angles.push('Benefit-led positioning');
  if (joined.includes('tool') || joined.includes('software')) angles.push('Workflow efficiency');
  if (joined.includes('kit') || joined.includes('gear')) angles.push('Bundle / starter kit');
  if (joined.includes('review') || joined.includes('comparison')) angles.push('Comparison intent');
  if (joined.includes('beginner')) angles.push('Beginner-friendly');

  return angles.slice(0, 4);
}

function inferStatus(trendScore: number): AdminTrendItem['status'] {
  if (trendScore >= 70) return 'rising';
  if (trendScore >= 45) return 'stable';
  if (trendScore > 0) return 'declining';
  return 'unknown';
}

function riskBaseForNiche(niche: string) {
  if (niche === 'health' || niche === 'finance') return 65;
  if (niche === 'beauty' || niche === 'fitness') return 50;
  return 35;
}

function buildHeuristicTrendItem(args: {
  niche: string;
  provider: SearchProvider;
  query: string;
  signals: SearchSignal[];
  nowIso: string;
}): AdminTrendItem {
  const { niche, provider, query, signals, nowIso } = args;
  const keywords = extractKeywords(signals);
  const uniqueDomains = uniqStrings(
    signals.map((signal) => {
      try {
        return new URL(signal.url).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
  );
  const text = `${signals.map((signal) => `${signal.title} ${signal.snippet}`).join(' ')}`.toLowerCase();
  const trendHints = ['trend', 'trending', 'growth', '2026', 'popular', 'best', 'top'].reduce((total, hint) => {
    return total + (text.includes(hint) ? 1 : 0);
  }, 0);
  const trendScore = clampScore(35 + signals.length * 4 + trendHints * 6);
  const competitionScore = clampScore(20 + uniqueDomains.length * 8);
  const opportunityScore = clampScore(55 + trendScore * 0.35 - competitionScore * 0.2);
  const riskScore = clampScore(riskBaseForNiche(niche));
  const firstSignal = signals[0];
  const title = firstSignal ? cleanTitle(firstSignal.title) : `${niche} opportunity scan`;
  const summary = firstSignal
    ? `Based on ${signals.length} live search results for "${query}", this niche shows active market coverage across ${uniqueDomains.length} domains with recurring commercial intent.`
    : `No live search results were available for "${query}".`;

  return {
    id: slugify(`${niche}-${title}`),
    title,
    niche,
    source: provider === 'google_custom_search' ? 'Google Custom Search' : provider === 'serpapi' ? 'SerpApi' : 'Unknown',
    trend_score: trendScore,
    competition_score: competitionScore,
    opportunity_score: opportunityScore,
    risk_score: riskScore,
    search_intent: 'commercial investigation',
    suggested_keywords: keywords,
    detected_angles: inferAngles(signals),
    summary,
    evidence_urls: signals.slice(0, 4).map((signal) => signal.url),
    last_updated: nowIso,
    status: inferStatus(trendScore),
  };
}

function coerceTrendItem(raw: any, fallback: AdminTrendItem): AdminTrendItem {
  return {
    id: typeof raw?.id === 'string' && raw.id ? slugify(raw.id) : fallback.id,
    title: typeof raw?.title === 'string' && raw.title ? raw.title.trim() : fallback.title,
    niche: typeof raw?.niche === 'string' && raw.niche ? raw.niche.trim().toLowerCase() : fallback.niche,
    source: typeof raw?.source === 'string' && raw.source ? raw.source.trim() : fallback.source,
    trend_score: clampScore(Number(raw?.trend_score ?? fallback.trend_score)),
    competition_score: clampScore(Number(raw?.competition_score ?? fallback.competition_score)),
    opportunity_score: clampScore(Number(raw?.opportunity_score ?? fallback.opportunity_score)),
    risk_score: clampScore(Number(raw?.risk_score ?? fallback.risk_score)),
    search_intent: typeof raw?.search_intent === 'string' && raw.search_intent ? raw.search_intent.trim() : fallback.search_intent,
    suggested_keywords: Array.isArray(raw?.suggested_keywords)
      ? uniqStrings(raw.suggested_keywords.map((value: unknown) => String(value).trim()).filter(Boolean)).slice(0, 8)
      : fallback.suggested_keywords,
    detected_angles: Array.isArray(raw?.detected_angles)
      ? uniqStrings(raw.detected_angles.map((value: unknown) => String(value).trim()).filter(Boolean)).slice(0, 6)
      : fallback.detected_angles,
    summary: typeof raw?.summary === 'string' && raw.summary ? raw.summary.trim() : fallback.summary,
    evidence_urls: Array.isArray(raw?.evidence_urls)
      ? uniqStrings(raw.evidence_urls.map((value: unknown) => String(value).trim()).filter(Boolean)).slice(0, 5)
      : fallback.evidence_urls,
    last_updated: fallback.last_updated,
    status: raw?.status === 'rising' || raw?.status === 'stable' || raw?.status === 'declining' || raw?.status === 'unknown'
      ? raw.status
      : fallback.status,
  };
}

async function fetchSerpApiResults(query: string, apiKey: string): Promise<SearchSignal[]> {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=us&hl=en&num=10&api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof (data as any)?.error === 'string' ? (data as any).error : `SerpApi request failed (${response.status})`;
    throw new Error(message);
  }

  const organic = Array.isArray((data as any)?.organic_results) ? (data as any).organic_results : [];
  return organic
    .slice(0, 8)
    .map((item: any) => ({
      title: typeof item?.title === 'string' ? item.title : '',
      snippet: typeof item?.snippet === 'string' ? item.snippet : '',
      url: typeof item?.link === 'string' ? item.link : '',
    }))
    .filter((item: SearchSignal) => item.title && item.url);
}

async function fetchGoogleCustomSearchResults(query: string, apiKey: string, cx: string): Promise<SearchSignal[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=8`;
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof (data as any)?.error?.message === 'string'
      ? (data as any).error.message
      : `Google Custom Search request failed (${response.status})`;
    throw new Error(message);
  }

  const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
  return items
    .slice(0, 8)
    .map((item: any) => ({
      title: typeof item?.title === 'string' ? item.title : '',
      snippet: typeof item?.snippet === 'string' ? item.snippet : '',
      url: typeof item?.link === 'string' ? item.link : '',
    }))
    .filter((item: SearchSignal) => item.title && item.url);
}

async function collectSearchSignals(
  niche: string,
  config: Awaited<ReturnType<typeof getSystemConfig>>
) {
  const provider = config.api_keys?.serp_provider === 'serpapi' ? 'serpapi' : 'none';
  const serpApiKey = config.api_keys?.serpapi_api_key;
  const serpApiEnabled = config.api_keys?.serpapi_enabled === true;
  const googleSearchKey = config.api_keys?.google_search_key;
  const googleSearchCx = config.api_keys?.google_search_cx;
  const query = buildQuery(niche);

  if (provider === 'serpapi' && serpApiEnabled && serpApiKey) {
    return {
      provider: 'serpapi' as const,
      query,
      signals: await fetchSerpApiResults(query, serpApiKey),
    };
  }

  if (googleSearchKey && googleSearchCx) {
    return {
      provider: 'google_custom_search' as const,
      query,
      signals: await fetchGoogleCustomSearchResults(query, googleSearchKey, googleSearchCx),
    };
  }

  return {
    provider: 'none' as const,
    query,
    signals: [],
  };
}

async function analyzeSignalsWithGemini(args: {
  niche: string;
  collected: SearchCollectionResult;
  nowIso: string;
}): Promise<AdminTrendItem> {
  const { niche, collected, nowIso } = args;
  const fallback = buildHeuristicTrendItem({
    niche,
    provider: collected.provider,
    query: collected.query,
    signals: collected.signals,
    nowIso,
  });

  if (!collected.signals.length) {
    return fallback;
  }

  const prompt = `
You are analyzing live search-result signals for an admin trends dashboard.

Return JSON only with this exact shape:
{
  "id": "string",
  "title": "string",
  "niche": "${niche}",
  "source": "string",
  "trend_score": 0,
  "competition_score": 0,
  "opportunity_score": 0,
  "risk_score": 0,
  "search_intent": "string",
  "suggested_keywords": ["string"],
  "detected_angles": ["string"],
  "summary": "string",
  "evidence_urls": ["https://..."],
  "status": "rising"
}

Rules:
- Use only the evidence provided.
- Do not invent API keys, vendors, or revenue numbers.
- Scores must be integers from 0 to 100.
- Keep suggested_keywords to 3-6 items.
- Keep detected_angles to 2-5 items.
- evidence_urls must be from the provided search results only.
- status must be one of: rising, stable, declining, unknown.

Search provider: ${collected.provider}
Search query: ${collected.query}
Results:
${JSON.stringify(collected.signals, null, 2)}
`.trim();

  const raw = await generateContent(prompt);
  const normalized = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(normalized);
  return coerceTrendItem(parsed, fallback);
}

function buildSourceStatus(config: Awaited<ReturnType<typeof getSystemConfig>>) {
  const hasSerpApi = config.api_keys?.serp_provider === 'serpapi' && !!config.api_keys?.serpapi_api_key && config.api_keys?.serpapi_enabled === true;
  const hasGoogleSearch = !!config.api_keys?.google_search_key && !!config.api_keys?.google_search_cx;
  const hasGemini = !!config.api_keys?.gemini;

  return {
    search: {
      configured: hasSerpApi || hasGoogleSearch,
      used: false,
      provider: hasSerpApi ? 'serpapi' : hasGoogleSearch ? 'google_custom_search' : 'none',
      detail: hasSerpApi
        ? 'Using SerpApi'
        : hasGoogleSearch
          ? 'Using Google Custom Search'
          : 'Configure SerpApi or Google Custom Search to enable Trends refresh.',
      errors: [] as string[],
    },
    gemini: {
      configured: hasGemini,
      used: false,
      provider: hasGemini ? 'gemini' : 'none',
      detail: hasGemini ? 'Gemini analysis enabled' : 'Gemini key missing. Falling back to heuristic summaries.',
      errors: [] as string[],
    },
  };
}

export async function getPersistedTrendsSnapshot(): Promise<AdminTrendsSnapshot | null> {
  return (await kvCache.get<AdminTrendsSnapshot>(SNAPSHOT_KEY, SNAPSHOT_NAMESPACE)) || null;
}

export async function buildCurrentTrendsSnapshot(): Promise<AdminTrendsSnapshot> {
  const config = await getSystemConfig();
  const sourceStatus = buildSourceStatus(config);
  const nowIso = new Date().toISOString();

  if (!sourceStatus.search.configured) {
    const persisted = await getPersistedTrendsSnapshot();
    return {
      state: 'setup_required',
      items: persisted?.items || [],
      last_updated: persisted?.last_updated || null,
      source_status: sourceStatus,
      errors: ['Search provider is not configured. Add SerpApi or Google Custom Search credentials in Admin Config.'],
    };
  }

  const persisted = await getPersistedTrendsSnapshot();
  if (persisted) {
    return {
      ...persisted,
      source_status: {
        search: {
          ...persisted.source_status.search,
          configured: sourceStatus.search.configured,
          provider: sourceStatus.search.provider,
          detail: sourceStatus.search.detail,
        },
        gemini: {
          ...persisted.source_status.gemini,
          configured: sourceStatus.gemini.configured,
          provider: sourceStatus.gemini.provider,
          detail: sourceStatus.gemini.detail,
        },
      },
    };
  }

  return {
    state: 'empty',
    items: [],
    last_updated: null,
    source_status: sourceStatus,
    errors: [],
  };
}

export async function refreshTrendsSnapshot(): Promise<AdminTrendsSnapshot> {
  const config = await getSystemConfig();
  const sourceStatus = buildSourceStatus(config);
  const nowIso = new Date().toISOString();
  const persisted = await getPersistedTrendsSnapshot();

  if (!sourceStatus.search.configured) {
    const snapshot: AdminTrendsSnapshot = {
      state: 'setup_required',
      items: persisted?.items || [],
      last_updated: persisted?.last_updated || null,
      source_status: sourceStatus,
      errors: ['Search provider is not configured. Add SerpApi or Google Custom Search credentials in Admin Config.'],
    };
    await kvCache.set(SNAPSHOT_KEY, snapshot, SNAPSHOT_NAMESPACE);
    return snapshot;
  }

  const items: AdminTrendItem[] = [];
  const errors: string[] = [];

  for (const niche of DEFAULT_NICHES) {
    try {
      const collected = await collectSearchSignals(niche, config);

      if (collected.provider !== 'none') {
        sourceStatus.search.used = true;
        sourceStatus.search.provider = collected.provider;
      }

      if (!collected.signals.length) {
        errors.push(`No search signals returned for ${niche}.`);
        continue;
      }

      let item = buildHeuristicTrendItem({
        niche,
        provider: collected.provider,
        query: collected.query,
        signals: collected.signals,
        nowIso,
      });

      if (sourceStatus.gemini.configured) {
        try {
          item = await analyzeSignalsWithGemini({ niche, collected, nowIso });
          sourceStatus.gemini.used = true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Gemini analysis failed';
          sourceStatus.gemini.errors.push(`${niche}: ${message}`);
          errors.push(`Gemini analysis fallback used for ${niche}: ${message}`);
        }
      }

      items.push(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown search error';
      sourceStatus.search.errors.push(`${niche}: ${message}`);
      errors.push(`${niche}: ${message}`);
    }
  }

  const sortedItems = items.sort((a, b) => b.opportunity_score - a.opportunity_score);
  const hasFreshItems = sortedItems.length > 0;
  const snapshot: AdminTrendsSnapshot = {
    state: hasFreshItems ? 'ready' : errors.length ? 'error' : 'empty',
    items: hasFreshItems ? sortedItems : persisted?.items || [],
    last_updated: hasFreshItems ? nowIso : persisted?.last_updated || null,
    source_status: sourceStatus,
    errors,
  };

  await kvCache.set(SNAPSHOT_KEY, snapshot, SNAPSHOT_NAMESPACE);
  return snapshot;
}
