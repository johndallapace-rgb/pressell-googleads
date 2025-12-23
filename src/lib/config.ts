import { createClient } from '@vercel/edge-config';

// Only create client if EDGE_CONFIG is present to avoid build errors
export const configClient = process.env.EDGE_CONFIG 
  ? createClient(process.env.EDGE_CONFIG) 
  : null;

export interface ProductConfig {
  name: string;
  platform: string;
  official_url: string;
  affiliate_url: string;
  youtube_review_id: string;
}

export interface CampaignConfig {
  default_lang: string;
  active_product_slug: string;
  products: Record<string, ProductConfig>;
}

export const defaultConfig: CampaignConfig = {
  default_lang: 'en',
  active_product_slug: 'mitolyn',
  products: {
    mitolyn: {
      name: 'Mitolyn',
      platform: 'clickbank',
      official_url: process.env.NEXT_PUBLIC_OFFICIAL_URL || 'https://mitolyn.com/welcome/?hop=zzzzz&hopId=689154d7-cdcb-4751-8970-bcbe6f44c1fc',
      affiliate_url: process.env.NEXT_PUBLIC_AFFILIATE_URL || 'https://22ce2d09wbexoq6fts-b0b7ufm.hop.clickbank.net',
      youtube_review_id: process.env.NEXT_PUBLIC_YOUTUBE_REVIEW_ID || 'PSd-VG31tcE'
    }
  }
};

export async function getCampaignConfig(): Promise<CampaignConfig> {
  if (!configClient) {
    // console.warn('EDGE_CONFIG not set, using default config with ENV fallbacks');
    return defaultConfig;
  }
  
  try {
    const config = await configClient.get<CampaignConfig>('campaign_config');
    
    // Merge with default config to ensure structure exists
    if (config) {
      // Ensure products object exists
      if (!config.products) config.products = {};
      // Ensure mitolyn exists
      if (!config.products.mitolyn) {
        config.products.mitolyn = defaultConfig.products.mitolyn;
      }
      return config;
    }
    
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching Edge Config:', error);
    return defaultConfig;
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
