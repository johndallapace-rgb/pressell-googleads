import { kv } from '@vercel/kv';
import { defaultConfig } from '@/data/defaultConfig';

// Removed Edge Config client
// export const configClient = process.env.EDGE_CONFIG 
//   ? createClient(process.env.EDGE_CONFIG) 
//   : null;
// We now use 'kv' directly imported from @vercel/kv which auto-configures 
// using KV_REST_API_URL and KV_REST_API_TOKEN env vars.

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

export type Testimonial = {
  name: string;
  age?: number;
  location?: string;
  rating: number; // 1-5
  text: string;
};

export type QuizOption = {
  text: string;
  value: string; // Internal value for logic if needed
  next?: number; // Index of next question (optional override)
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

export type QuizConfig = {
  enabled: boolean;
  questions: QuizQuestion[];
};

import { AdsConfig } from '@/lib/ads/types';

export type ProductConfig = {
  id?: string; // Unique UUID
  slug: string;
  name: string;
  platform: string;
  language: string;
  status: 'active' | 'paused';
  vertical: 'health' | 'diy' | 'pets' | 'dating' | 'finance' | 'other';
  template: 'editorial' | 'story' | 'comparison' | 'quiz'; // Added 'quiz'
  theme?: string;
  ab_test?: AbTestConfig;
  official_url: string;
  affiliate_url: string;
  youtube_review_id?: string;
  image_url: string;
  image_prompt?: string; // AI Suggested Prompt
  google_ads_id?: string; // Google Ads Pixel ID (AW-XXXXXXXX)
  google_ads_label?: string; // Conversion Label (optional)
  meta_pixel_id?: string; // Meta/Facebook Pixel ID (XXXXXXXXX)
  support_email?: string; // e.g. support@topproductofficial.com
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
  testimonials?: Testimonial[];
  quiz?: QuizConfig;
  
  // New Fields for Global Scaling
  subdomain?: string; // e.g. "health", "finance"

  // Ads Module Configuration
  ads?: AdsConfig;
};

// Platform Configurations
export type PlatformConfig = {
    name: string;
    status: 'Active' | 'Connected' | 'Pending' | 'Disconnected';
    credentials: {
        affiliate_id?: string;
        api_key?: string; // Generic
        dev_key?: string; // CB
        clerk_key?: string; // CB
        marketplace_url?: string;
    }
};

export interface CampaignConfig {
  active_product_slug: string;
  default_lang: string;
  products: Record<string, ProductConfig>;
  platforms?: Record<string, PlatformConfig>; // New field for storing keys
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  // Safety check for Build Time or Missing Env
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      // Silent fallback during build to prevent noise/errors
      return defaultConfig;
  }

  try {
    // Fetch from Vercel KV
    let config = await kv.get<CampaignConfig>('campaign_config');

    // Handle stringified JSON (common issue in Vercel env vars sometimes)
    if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch (e) { console.error('Error parsing campaign_config JSON string', e); }
    }
    
    if (config && typeof config === 'object') {
      const cfg = config as any;
      return {
        ...defaultConfig,
        ...cfg, // Merges root keys (Formato B support)
        products: {
            ...defaultConfig.products,
            ...(cfg.products || {})
        }
      };
    }
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching Vercel KV:', error);
    return defaultConfig;
  }
}

export async function getProduct(slug: string): Promise<ProductConfig | null> {
  try {
    const config = await getCampaignConfig();
    const cfgAny = config as any;
    
    // Support Formato A (products[slug]) AND Formato B (root[slug])
    // Priority: products object -> root object
    const product = cfgAny.products?.[slug] ?? cfgAny?.[slug];
    
    if (product) {
        // Polyfill slug if missing
        if (!product.slug) product.slug = slug;
        return product;
    }
    
    return null;
  } catch (error) {
    console.error(`Error in getProduct for slug ${slug}:`, error);
    return null;
  }
}

export async function listProducts(): Promise<ProductConfig[]> {
  const config = await getCampaignConfig();
  if (!config.products) return [];
  
  // Robust mapping: Ensure slug is present by using the key if missing in the value
  return Object.entries(config.products)
    .map(([key, value]) => ({
        ...value,
        slug: value.slug || key,
        // Ensure other critical fields have fallbacks
        name: value.name || 'Untitled Product',
        vertical: value.vertical || 'other',
        language: value.language || 'en'
    }))
    .filter(p => p.slug && p.slug !== 'undefined' && p.slug !== 'null');
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
    try {
        return await kv.get<CampaignMetrics>('campaign_metrics') || {};
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return {};
    }
}

export async function updateCampaignConfig(newConfig: CampaignConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await kv.set('campaign_config', newConfig);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating Vercel KV:', error);
    return { success: false, error: error.message };
  }
}
