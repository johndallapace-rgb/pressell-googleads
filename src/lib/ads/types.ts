import { z } from 'zod';
import { StrategySettings, AdAssets } from './strategyPlanner';

// Re-export for convenience
export type { StrategySettings, AdAssets };

export const AdGroupSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()),
  negatives: z.array(z.string()),
  ads: z.array(z.object({
    headlines: z.array(z.string()),
    descriptions: z.array(z.string()),
    finalUrl: z.string(),
    path1: z.string().optional(),
    path2: z.string().optional(),
    label: z.string().optional()
  }))
});

export const CampaignSchema = z.object({
  product: z.string(),
  language: z.string(),
  campaignName: z.string(),
  adGroups: z.array(AdGroupSchema)
});

export const AdsConfigSchema = z.object({
  slug: z.string(),
  vertical: z.enum(['health', 'diy', 'general', 'pets', 'dating', 'finance', 'other']),
  languages: z.array(z.string()),
  status: z.enum(['draft', 'ready', 'published', 'paused']),
  generatedAt: z.string().datetime().optional(),
  version: z.number().int().default(1),
  settings: z.custom<StrategySettings>(), // Zod custom validation if needed, or just type
  campaigns: z.array(CampaignSchema).optional()
});

export type AdsConfig = z.infer<typeof AdsConfigSchema>;

export type AdsListFilter = {
  status?: AdsConfig['status'];
  vertical?: string;
  search?: string;
};
