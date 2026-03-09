import { createClient } from '@vercel/kv';
import { defaultConfig } from '@/data/defaultConfig';
import { logger } from '@/lib/logger';

import { AdsConfig } from '@/lib/ads/types';

// =========================
// Types
// =========================

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

export type ProductConfig = {
  id?: string; // Unique UUID
  slug: string;
  name: string;
  platform: string;
  language: string;
  status: 'active' | 'paused';
  vertical: 'health' | 'diy' | 'pets' | 'dating' | 'finance' | 'other';
  template: 'editorial' | 'story' | 'comparison' | 'quiz' | 'cookie'; // Added 'cookie'
  theme?: string;
  ab_test?: AbTestConfig;
  official_url: string;
  affiliate_url: string;
  youtube_review_id?: string;
  video_url?: string; // New: Generic Video URL (YouTube/Vimeo/MP4)
  image_url: string; // "Product Image" (Bottle/Box only)
  sales_page_image_url?: string; // NEW: "Sales Page Preview" (Full Background Context)
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
  
  [key: string]: any;
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

export interface SystemConfig {
    affiliate_nickname?: string; // e.g. "johnpace"
    api_keys: {
        gemini?: string;
        vercel?: string;
        google_search_key?: string; // Google Search API Key
        google_search_cx?: string; // Google Search Engine ID
        clickbank_api_token?: string; // Unified Token
        clickbank_nickname?: string; // Account Nickname
        buygoods_api?: string; 
        buygoods_account_id?: string; // New
        maxweb_api?: string; 
        maxweb_affiliate_id?: string; // New
        google_ads_refresh_token?: string;
    };
    platforms: Record<string, PlatformConfig>;
}

export type CampaignConfig = {
  default_lang: string;
  products: Record<string, ProductConfig>;
  platforms?: Record<string, PlatformConfig>; // New field for storing keys
  system?: SystemConfig; // Global System Config
  [key: string]: any;
};

// =========================
// KV Setup
// =========================
export const kv =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

// =========================
// Compatibility Read Helpers
// =========================
export async function getCampaignConfig(): Promise<CampaignConfig> {
  if (!kv) {
    return (defaultConfig as CampaignConfig) || { products: {} };
  }

  try {
    const config = await kv.get<CampaignConfig>('campaign_config');

    if (!config || typeof config !== 'object') {
      return (defaultConfig as CampaignConfig) || { products: {} };
    }

    return {
      ...(defaultConfig as CampaignConfig),
      ...config,
      products: {
        ...(((defaultConfig as CampaignConfig)?.products ?? {}) as Record<string, ProductConfig>),
        ...((config?.products ?? {}) as Record<string, ProductConfig>),
      },
    };
  } catch (e: any) {
    console.error('[GET_CAMPAIGN_CONFIG_ERROR]', e);
    logger.error('config', {
      event: 'GET_CAMPAIGN_CONFIG_ERROR',
      error: e?.message,
    });
    return (defaultConfig as CampaignConfig) || { products: {} };
  }
}

export async function listProducts(): Promise<ProductConfig[]> {
  try {
    const config = await getCampaignConfig();

    if (!config?.products || typeof config.products !== 'object') {
      return [];
    }

    return Object.values(config.products).filter(Boolean) as ProductConfig[];
  } catch (e: any) {
    console.error('[LIST_PRODUCTS_ERROR]', e);
    logger.error('config', {
      event: 'LIST_PRODUCTS_ERROR',
      error: e?.message,
    });
    return [];
  }
}

// =========================
// Canonical Save
// =========================
export async function saveProduct(
  product: ProductConfig,
  source: string = 'Generic'
): Promise<boolean> {
  if (!kv || !product.slug) return false;

  // Concurrency Lock
  const lockKey = `lock:save:${product.vertical || 'generic'}:${product.slug}`;
  let lockAcquired = false;

  try {
    const result = await kv.set(lockKey, 'locked', { nx: true, ex: 15 });
    lockAcquired = (result as any) === 'OK' || (result as any) === 1 || (result as any) === true;

    if (!lockAcquired) {
      console.warn(`[SAVE_LOCK_SKIPPED] Lock held for ${product.slug}`, { source });
      logger.info('save-product', {
        event: 'SAVE_LOCK_SKIPPED',
        slug: product.slug,
        source,
        reason: 'Lock held',
      });
      return false;
    }

    console.log(`[SAVE_LOCK_ACQUIRED] ${product.slug}`, { source });
    logger.info('save-product', {
      event: 'SAVE_LOCK_ACQUIRED',
      slug: product.slug,
      source,
    });

    let key = product.slug;
    if (product.vertical) {
      key = `${product.vertical}:${product.slug}`;
    }

    console.log(`[SAVE_PRODUCT]`, {
      source,
      vertical: product.vertical,
      slug: product.slug,
      key,
    });

    logger.save({
      source,
      vertical: product.vertical,
      slug: product.slug,
      key,
      status: 'attempting',
    });

    // 1. Primary key: vertical:slug
    try {
      await kv.set(key, product);
    } catch (error: any) {
      console.error('[SAVE_PRODUCT_ERROR]', {
        source,
        vertical: product.vertical,
        slug: product.slug,
        key,
        error: error?.message,
      });

      logger.error('save-product', {
        event: 'SAVE_PRODUCT_ERROR',
        source,
        slug: product.slug,
        key,
        error: error?.message,
      });

      throw error;
    }

    // 2. Fallback key: slug
    try {
      await kv.set(product.slug, product);
    } catch (error: any) {
      console.error('[SAVE_PRODUCT_FALLBACK_ERROR]', {
        source,
        slug: product.slug,
        key: product.slug,
        error: error?.message,
      });

      logger.warn('save-product', {
        event: 'SAVE_PRODUCT_FALLBACK_ERROR',
        source,
        slug: product.slug,
        key: product.slug,
        error: error?.message,
      });
    }

    if (key !== product.slug) {
      console.log('[SAVE_PRODUCT_FALLBACK]', {
        source,
        slug: product.slug,
        key: product.slug,
      });

      logger.save({
        source,
        slug: product.slug,
        key: product.slug,
        status: 'fallback_saved',
      });
    }

    logger.save({
      source,
      slug: product.slug,
      key,
      status: 'success',
    });

    return true;
  } catch (e: any) {
    console.error('[KV-Save] Unexpected Error:', e);
    logger.error('save-product', {
      event: 'SAVE_UNEXPECTED_ERROR',
      error: e?.message,
      source,
    });
    return false;
  } finally {
    if (lockAcquired) {
      try {
        await kv.del(lockKey);
        console.log(`[SAVE_LOCK_RELEASED] ${product.slug}`);
        logger.info('save-product', {
          event: 'SAVE_LOCK_RELEASED',
          slug: product.slug,
        });
      } catch (e: any) {
        console.error('[SAVE_LOCK_ERROR] Failed to release lock', e);
        logger.error('save-product', {
          event: 'SAVE_LOCK_ERROR',
          slug: product.slug,
          error: e?.message,
        });
      }
    }
  }
}

// =========================
// Self-Heal
// =========================
export async function ensureCanonicalKeys(
  product: ProductConfig,
  source: string = 'Self-Heal'
): Promise<boolean> {
  if (!kv || !product.slug) return false;

  if (!product.vertical || product.status !== 'active') {
    return false;
  }

  const verticalKey = `${product.vertical}:${product.slug}`;
  const slugKey = product.slug;

  try {
    const existsVertical = await kv.exists(verticalKey);
    const existsSlug = await kv.exists(slugKey);

    if (existsVertical && existsSlug) {
      return true;
    }

    console.log(`[SELF_HEAL_TRIGGERED] Missing keys for ${product.slug}. Repairing...`, {
      missingVertical: !existsVertical,
      missingSlug: !existsSlug,
      source,
    });

    logger.info('self-heal', {
      event: 'SELF_HEAL_TRIGGERED',
      slug: product.slug,
      source,
      missingVertical: !existsVertical,
      missingSlug: !existsSlug,
    });

    await saveProduct(product, source);

    console.log(`[SELF_HEAL_SUCCESS] Repaired keys for ${product.slug}`, { source });
    logger.info('self-heal', {
      event: 'SELF_HEAL_SUCCESS',
      slug: product.slug,
      source,
    });

    return true;
  } catch (e: any) {
    console.error(`[SELF_HEAL_ERROR] Failed to repair ${product.slug}`, {
      error: e?.message,
      source,
    });

    logger.error('self-heal', {
      event: 'SELF_HEAL_ERROR',
      slug: product.slug,
      error: e?.message,
      source,
    });

    return false;
  }
}// =========================
// Product Read Helpers
// =========================

export async function getProduct(
  slug: string,
  vertical?: string
): Promise<ProductConfig | null> {
  if (!slug) return null;

  try {
    // 1) Try canonical key first: vertical:slug (IF KV IS ACTIVE)
    if (kv && vertical) {
      const verticalKey = `${vertical}:${slug}`;
      const byVerticalKey = await kv.get<ProductConfig>(verticalKey);
      if (byVerticalKey && typeof byVerticalKey === 'object') {
        return byVerticalKey;
      }
    }

    // 2) Try slug-only fallback (IF KV IS ACTIVE)
    if (kv) {
      const bySlugKey = await kv.get<ProductConfig>(slug);
      if (bySlugKey && typeof bySlugKey === 'object') {
        return bySlugKey;
      }
    }

    // 3) Fallback to campaign_config / admin index (ALWAYS RUNS)
    const config = await getCampaignConfig();
    const products = config?.products || {};

    // exact vertical:slug in index
    if (vertical) {
      const indexedKey = `${vertical}:${slug}`;
      if (products[indexedKey]) {
        return products[indexedKey];
      }
    }

    // exact slug key in index
    if (products[slug]) {
      return products[slug];
    }

    // 4) Last-resort scan by object values
    const found = Object.values(products).find((p: any) => {
      if (!p || typeof p !== 'object') return false;
      if (p.slug !== slug) return false;
      if (vertical && p.vertical && p.vertical !== vertical) return false;
      return true;
    });

    return (found as ProductConfig) || null;
  } catch (e: any) {
    console.error('[GET_PRODUCT_ERROR]', {
      slug,
      vertical,
      error: e?.message,
    });

    logger.error('config', {
      event: 'GET_PRODUCT_ERROR',
      slug,
      vertical,
      error: e?.message,
    });

    return null;
  }
}

export async function debugKV(slug: string, vertical?: string) {
  if (!kv || !slug) {
    return {
      status: 'unavailable',
      reason: 'KV not configured or slug missing',
    };
  }

  const verticalKey = vertical ? `${vertical}:${slug}` : null;

  try {
    const result: Record<string, any> = {
      status: 'ok',
      slug,
      vertical: vertical || null,
      checkedKeys: {},
    };

    if (verticalKey) {
      const verticalExists = await kv.exists(verticalKey);
      const verticalValue = verticalExists ? await kv.get(verticalKey) : null;
      result.checkedKeys[verticalKey] = {
        exists: !!verticalExists,
        sample: verticalValue ? 'FOUND' : null,
      };
    }

    const slugExists = await kv.exists(slug);
    const slugValue = slugExists ? await kv.get(slug) : null;
    result.checkedKeys[slug] = {
      exists: !!slugExists,
      sample: slugValue ? 'FOUND' : null,
    };

    const config = await getCampaignConfig();
    const products = config?.products || {};

    result.index = {
      hasVerticalKey: !!(verticalKey && products[verticalKey]),
      hasSlugKey: !!products[slug],
      foundByScan: !!Object.values(products).find((p: any) => {
        if (!p || typeof p !== 'object') return false;
        if (p.slug !== slug) return false;
        if (vertical && p.vertical && p.vertical !== vertical) return false;
        return true;
      }),
    };

    return result;
  } catch (e: any) {
    console.error('[DEBUG_KV_ERROR]', {
      slug,
      vertical,
      error: e?.message,
    });

    logger.error('config', {
      event: 'DEBUG_KV_ERROR',
      slug,
      vertical,
      error: e?.message,
    });

    return {
      status: 'error',
      slug,
      vertical: vertical || null,
      error: e?.message,
    };
  }
}

// =========================
// Metrics & System (Restored Compatibility)
// =========================

export interface CampaignMetrics {
    [slug: string]: {
        [variantId: string]: {
            views: number;
            clicks: number;
        };
    };
}

export async function getCampaignMetrics(): Promise<CampaignMetrics> {
  if (!kv) return {};
  try {
    return (await kv.get('campaign_metrics')) || {};
  } catch (e) {
    return {};
  }
}

export async function updateCampaignConfig(config: CampaignConfig): Promise<{ success: boolean; error?: string }> {
  if (!kv) return { success: false, error: 'KV not configured' };
  try {
    await kv.set('campaign_config', config);
    return { success: true };
  } catch (e: any) {
    console.error('[UPDATE_CONFIG_ERROR]', e);
    return { success: false, error: e?.message };
  }
}

export async function deleteProductKey(key: string): Promise<boolean> {
  if (!kv) return false;
  try {
    await kv.del(key);
    return true;
  } catch (e) {
    return false;
  }
}

export async function cleanupGhostKeys(): Promise<{ deleted: string[], kept: string[] }> {
  if (!kv) return { deleted: [], kept: [] };
  try {
    const keys = await kv.keys('*');
    const config = await getCampaignConfig();
    const products = config.products || {};
    const validKeys = new Set(Object.keys(products));
    const systemKeys = ['campaign_config', 'campaign_metrics', 'default_lang'];
    
    const deleted: string[] = [];
    const kept: string[] = [];

    for (const key of keys) {
      if (systemKeys.includes(key) || validKeys.has(key)) {
        kept.push(key);
        continue;
      }
      
      // Also keep canonical fallback keys if they match a valid product slug
      const isCanonical = Object.values(products).some((p: any) => p.slug === key);
      if (isCanonical) {
          kept.push(key);
          continue;
      }

      await kv.del(key);
      deleted.push(key);
    }
    
    return { deleted, kept };
  } catch (e) {
    console.error('[CLEANUP_ERROR]', e);
    return { deleted: [], kept: [] };
  }
}

export async function getSystemConfig(): Promise<any> {
  const config = await getCampaignConfig();
  return config.system || {
    affiliate_nickname: 'johnpace',
    api_keys: {},
    platforms: {}
  };
}

export async function updateSystemConfig(sysConfig: any): Promise<boolean> {
  const config = await getCampaignConfig();
  config.system = sysConfig;
  const result = await updateCampaignConfig(config);
  return result.success;
}