export type AdminTrendStatus = 'rising' | 'stable' | 'declining' | 'unknown';

export interface AdminTrendItem {
  id: string;
  title: string;
  niche: string;
  source: string;
  trend_score: number;
  competition_score: number;
  opportunity_score: number;
  risk_score: number;
  search_intent: string;
  suggested_keywords: string[];
  detected_angles: string[];
  summary: string;
  evidence_urls: string[];
  last_updated: string;
  status: AdminTrendStatus;
}

export interface AdminTrendSourceDetail {
  configured: boolean;
  used: boolean;
  provider?: string;
  detail?: string;
  errors: string[];
}

export type AdminTrendsState = 'ready' | 'setup_required' | 'empty' | 'error';

export interface AdminTrendsSnapshot {
  state: AdminTrendsState;
  items: AdminTrendItem[];
  last_updated: string | null;
  source_status: {
    search: AdminTrendSourceDetail;
    gemini: AdminTrendSourceDetail;
  };
  errors: string[];
}
