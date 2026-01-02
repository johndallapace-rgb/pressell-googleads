import { createClient } from '@vercel/edge-config';
import { defaultConfig } from '@/data/defaultConfig';

export const configClient = process.env.EDGE_CONFIG 
  ? createClient(process.env.EDGE_CONFIG) 
  : null;

export type SeoConfig = {
  title: string;
  description: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type ContentSection = {
  title: string;
  content: string[];
};

export type ProsCons = {
  pros: string[];
  cons: string[];
};

export type Variant = {
  id: string;
  weight: number;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  hero_style?: string;
};

export type AbTestConfig = {
  enabled: boolean;
  variants: Variant[];
};

export type ProductConfig = {
  slug: string;
  name: string;
  platform: string;
  language: string;
  status: 'active' | 'paused';
  vertical: 'health' | 'diy' | 'pets' | 'dating' | 'finance' | 'other';
  template: 'editorial' | 'story' | 'comparison';
  theme?: string;
  ab_test?: AbTestConfig;
  official_url: string;
  affiliate_url: string;
  youtube_review_id?: string;
  image_url: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  bullets: string[];
  faq: FaqItem[];
  seo: SeoConfig;
  
  // Extended fields for Presell Page
  whatIs?: ContentSection;
  howItWorks?: ContentSection;
  prosCons?: ProsCons;
};

export interface CampaignConfig {
  active_product_slug: string;
  default_lang: string;
  products: Record<string, ProductConfig>;
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  if (!configClient) {
    console.warn('EDGE_CONFIG not found, using default config');
    return defaultConfig;
  }
  
  try {
    const config = await configClient.get<CampaignConfig>('campaign_config');
    if (config) {
      return {
        ...defaultConfig,
        ...config,
        products: {
            ...defaultConfig.products,
            ...(config.products || {})
        }
      };
    }
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching Edge Config:', error);
    return defaultConfig;
  }
}

export async function getProduct(slug: string): Promise<ProductConfig | null> {
  const config = await getCampaignConfig();
  return config.products[slug] || null;
}

export async function listProducts(): Promise<ProductConfig[]> {
  const config = await getCampaignConfig();
  return Object.values(config.products);
}

export interface CampaignMetrics {
    [slug: string]: {
        [variantId: string]: {
            views: number;
            clicks: number;
        };
    };
}

export async function getCampaignMetrics(): Promise<CampaignMetrics> {
    if (!configClient) return {};
    try {
        return await configClient.get<CampaignMetrics>('campaign_metrics') || {};
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return {};
    }
}

export async function updateCampaignConfig(newConfig: CampaignConfig): Promise<boolean> {
  if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
    console.error('Missing VERCEL_API_TOKEN or EDGE_CONFIG_ID');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: 'campaign_config',
              value: newConfig,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating Edge Config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating Edge Config:', error);
    return false;
  }
}
