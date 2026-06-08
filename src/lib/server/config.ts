import 'server-only';

import { defaultConfig } from '@/data/defaultConfig';
import { normalizeConfig } from '@/lib/campaignConfig';
import { CampaignConfig, SystemConfig } from '@/lib/shared/config';
import { kvCache } from '@/lib/server/kv-cache';
import { productIndex } from '@/lib/server/product-index';

const CAMPAIGN_CONFIG_KEY = 'campaign_config';
const SYSTEM_CONFIG_KEY = 'system_config';

function tryParseJson(raw: any): any {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickEffectiveCampaignConfig(raw: any): any {
  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const effective = (parsed as any).campaign_config || parsed;
  if (!effective || typeof effective !== 'object') return null;
  return effective;
}

function normalizeSystemConfig(raw: any): SystemConfig {
  const base = raw && typeof raw === 'object' ? (raw as any) : {};
  const api_keys = base.api_keys && typeof base.api_keys === 'object' ? base.api_keys : {};
  const platforms = base.platforms && typeof base.platforms === 'object' ? base.platforms : {};
  return { ...base, api_keys, platforms } as SystemConfig;
}

async function readSystemConfigFromCampaignStore(): Promise<SystemConfig | null> {
  const raw = await kvCache.get<any>(CAMPAIGN_CONFIG_KEY, 'campaign_config');
  const effective = pickEffectiveCampaignConfig(raw);
  if (!effective) return null;
  return effective.system ? normalizeSystemConfig(effective.system) : null;
}

async function readSystemConfigFromSystemStore(): Promise<SystemConfig | null> {
  const raw = await kvCache.get<any>(SYSTEM_CONFIG_KEY, 'system_config');
  if (!raw) return null;
  return normalizeSystemConfig(raw);
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const fromSystem = await readSystemConfigFromSystemStore();
  if (fromSystem) return fromSystem;

  const fromCampaign = await readSystemConfigFromCampaignStore();
  if (fromCampaign) return fromCampaign;

  return normalizeSystemConfig({ api_keys: {}, platforms: {} });
}

function normalizeCampaignConfig(raw: any): CampaignConfig {
  const effective = pickEffectiveCampaignConfig(raw) || {};
  const normalized = normalizeConfig(effective);
  const merged: CampaignConfig = { ...defaultConfig, ...effective, ...normalized };
  if (!merged.platforms) merged.platforms = defaultConfig.platforms;
  return merged;
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  const raw = await kvCache.get<any>(CAMPAIGN_CONFIG_KEY, 'campaign_config');
  const cfg = normalizeCampaignConfig(raw);

  if (!cfg.system) {
    const sys = await readSystemConfigFromSystemStore();
    if (sys) cfg.system = sys;
  }

  productIndex.rebuild(cfg);
  return cfg;
}

export async function updateCampaignConfig(config: CampaignConfig): Promise<boolean> {
  const normalized = normalizeCampaignConfig(config);
  const ok = await kvCache.set(CAMPAIGN_CONFIG_KEY, normalized, 'campaign_config');
  if (ok) productIndex.rebuild(normalized);

  if (normalized.system) {
    await kvCache.set(SYSTEM_CONFIG_KEY, normalizeSystemConfig(normalized.system), 'system_config');
  }

  return ok;
}

export async function updateSystemConfig(config: SystemConfig): Promise<boolean> {
  const normalized = normalizeSystemConfig(config);
  const ok = await kvCache.set(SYSTEM_CONFIG_KEY, normalized, 'system_config');

  const raw = await kvCache.get<any>(CAMPAIGN_CONFIG_KEY, 'campaign_config');
  if (raw && typeof raw === 'object' && (raw as any).campaign_config && typeof (raw as any).campaign_config === 'object') {
    const next = { ...(raw as any), campaign_config: { ...(raw as any).campaign_config, system: normalized } };
    await kvCache.set(CAMPAIGN_CONFIG_KEY, next, 'campaign_config');
  } else {
    const existingEffective = pickEffectiveCampaignConfig(raw) || {};
    await kvCache.set(CAMPAIGN_CONFIG_KEY, { ...defaultConfig, ...existingEffective, system: normalized }, 'campaign_config');
  }

  return ok;
}

export type CampaignMetrics = Record<string, Record<string, { views: number; clicks: number }>>;

export async function getCampaignMetrics(): Promise<CampaignMetrics> {
  const raw = await kvCache.get<CampaignMetrics>('campaign_metrics', 'metrics');
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

export function isSnapshotLoaded(): boolean {
  return false;
}

export function isDurableSnapshotLoaded(): boolean {
  return false;
}

export { kv } from '@/lib/server/storage';

export type { SystemConfig };
