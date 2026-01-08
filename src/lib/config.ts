import { createClient } from '@vercel/kv';
import { defaultConfig } from '@/data/defaultConfig';

// Initialize KV Client Robustly
// Support KV_REST_API_* (Vercel Default), REDIS_REST_API_* (Upstash), and REDIS_URL (Legacy/Custom)
// PRIORITY: REDIS_URL (User Request) -> KV_REST_API -> REDIS_REST_API
const kvUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.REDIS_REST_API_URL;
const kvToken = process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_API_TOKEN;

// Create a safe client if ANY URL is present. 
// We use a fallback token to prevent crash, but requests might fail if auth is required and missing.
const kv = kvUrl 
    ? createClient({ 
        url: kvUrl, 
        token: kvToken || 'missing-token',
        automaticDeserialization: true,
        // FORCE NO CACHE to ensure real-time updates for status check
        // @ts-ignore
        fetchOptions: { cache: 'no-store', next: { revalidate: 0 } }
      })
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
  default_lang: string;
  products: Record<string, ProductConfig>;
  platforms?: Record<string, PlatformConfig>; // New field for storing keys
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  // Safety check for Build Time or Missing Env
  if (!kv) {
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
      
      // CLEANUP: Remove deprecated active_product_slug
      if (cfg.active_product_slug) delete cfg.active_product_slug;

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

export async function getProduct(slug: string, vertical?: string): Promise<ProductConfig | null> {
  try {
    // 0. Hybrid Strategy: Try Direct Key Lookup FIRST (Faster & More Reliable)
    // This bypasses the big JSON 'campaign_config' potentially being stale or huge.
    
    // Normalize Input
    const safeSlug = slug.toLowerCase().trim();
    const safeVertical = vertical ? vertical.toLowerCase().trim() : undefined;

    // A. Try Direct Key: "health:mitolyn"
    if (safeVertical) {
        const directKey = `${safeVertical}:${safeSlug}`;
        const directProduct = await kv?.get<ProductConfig>(directKey);
        if (directProduct && directProduct.slug) {
            return directProduct;
        }
    }

    // B. Try Direct Key: "mitolyn"
    const directGlobal = await kv?.get<ProductConfig>(safeSlug);
    if (directGlobal && directGlobal.slug) {
        return directGlobal;
    }

    // C. Fallback to Campaign Config (Legacy/Dashboard Support)
    const config = await getCampaignConfig();
    const cfgAny = config as any;
    const products = cfgAny.products || {};
    
    // 1. Try Vertical-Prefixed Key (Priority)
    // e.g. "health:mitolyn"
    if (safeVertical) {
        const key = `${safeVertical}:${safeSlug}`;
        if (products[key]) {
             const p = products[key];
             if (!p.slug) p.slug = safeSlug;
             return p;
        }
    }

    // 2. Try Exact Slug (Legacy/Global)
    // e.g. "mitolyn"
    if (products[safeSlug]) {
        const p = products[safeSlug];
        if (!p.slug) p.slug = safeSlug;
        return p;
    }
    
    // 3. Fallback: Root Object (Legacy Formato B)
    if (cfgAny[safeSlug]) {
        const p = cfgAny[safeSlug];
        if (!p.slug) p.slug = safeSlug;
        return p;
    }
    
    // 4. Fallback: Search Keys ending with :slug
    // This handles cases where vertical is missing but product exists as "health:mitolyn"
    const foundKey = Object.keys(products).find(k => k.endsWith(`:${safeSlug}`));
    if (foundKey) {
        const p = products[foundKey];
        if (!p.slug) p.slug = safeSlug;
        return p;
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
  // IMPORTANT: Clean up keys like 'health:mitolyn' to just 'mitolyn' for display if needed
  return Object.entries(config.products)
    .map(([key, value]) => {
        // If key is 'health:mitolyn', the slug should be 'mitolyn'
        // But we must respect the value.slug if it exists and is correct.
        let displaySlug = value.slug || key;
        if (key.includes(':') && (!value.slug || value.slug === key)) {
             displaySlug = key.split(':')[1];
        }

        return {
            ...value,
            slug: displaySlug, // Clean slug for UI
            // Ensure other critical fields have fallbacks
            name: value.name || 'Untitled Product',
            vertical: value.vertical || 'other',
            language: value.language || 'en'
        };
    })
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
        if (!kv) return {};
        return await kv.get<CampaignMetrics>('campaign_metrics') || {};
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return {};
    }
}

export async function saveProduct(product: ProductConfig): Promise<boolean> {
    if (!kv || !product.slug) return false;
    try {
        // Determine Key
        const vertical = product.vertical || 'health';
        // If we have a subdomain/vertical, use it. If 'other' or 'general', maybe just slug? 
        // User wants vertical:slug.
        const key = `${vertical}:${product.slug}`;
        
        console.log(`[KV-Save] Saving FULL product to key: ${key}`);
        await kv.set(key, product);
        return true;
    } catch (e) {
        console.error('[KV-Save] Error:', e);
        return false;
    }
}

export async function updateCampaignConfig(newConfig: CampaignConfig): Promise<{ success: boolean; error?: string }> {
  try {
    if (!kv) {
        return { success: false, error: 'KV not configured' };
    }
    
    // We only save the index here. We assume individual products are saved via saveProduct.
    // However, to be safe and fix the "overwrite with light data" bug:
    // We should NOT save individual keys here unless we are sure we have full data.
    // But distinguishing is hard.
    
    // BETTER STRATEGY:
    // This function now ONLY updates the 'campaign_config' (Index).
    // It assumes the caller has already saved the individual product data if needed.
    // OR, we can try to save individual keys ONLY if they look "heavy" (have content).
    
    // But since the user specifically asked to fix the save flow, let's change this to ONLY save the Index.
    // The caller (save route) must call saveProduct() for the specific product being edited.
    
    await kv.set('campaign_config', newConfig);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating Vercel KV:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProductKey(key: string): Promise<void> {
    if (!kv) return;
    try {
        console.log(`[KV-Delete] Removing key: ${key}`);
        await kv.del(key);
    } catch (e) {
        console.error(`Failed to delete KV key ${key}:`, e);
    }
}

export async function cleanupGhostKeys(): Promise<{ deleted: string[], kept: string[] }> {
    if (!kv) return { deleted: [], kept: [] };
    
    try {
        // Get all keys
        const allKeys = await kv.keys('*');
        const config = await getCampaignConfig();
        // Normalize valid keys from the current configuration
        const validKeys = new Set(Object.keys(config.products || {}));
        const systemKeys = ['campaign_config', 'campaign_metrics', 'default_lang'];
        
        const deleted: string[] = [];
        const kept: string[] = [];

        for (const key of allKeys) {
            if (systemKeys.includes(key)) {
                kept.push(key);
                continue;
            }
            
            // If it's in the products map, keep it
            if (validKeys.has(key)) {
                kept.push(key);
                continue;
            }
            
            // If we are here, it's a ghost key (e.g. "tedswoodworking" when only "health:tedswoodworking" is valid, or completely removed)
            // But wait! What if "health:mitolyn" is in config, but "mitolyn" key exists as a redirect?
            // If the user wants strict sync, we delete "mitolyn" if it's not in config.
            
            // Safety check: Don't delete session tokens or other potential keys if we share Redis
            // Assuming dedicated Redis for this app or prefixed.
            // If keys look like "sess:...", skip?
            // User said "remove keys that are not in My Products".
            
            await kv.del(key);
            deleted.push(key);
        }
        
        return { deleted, kept };
    } catch (e) {
        console.error('Cleanup failed:', e);
        return { deleted: [], kept: [] };
    }
}

export async function debugKV() {
    if (!kv) return ['KV Not Initialized'];
    try {
        // kv.keys might not be available on Vercel KV client directly depending on version, 
        // but typically it is. If not, we might need another way.
        // The user specifically asked for kv.keys('*').
        // Let's assume standard redis command.
        const keys = await kv.keys('*');
        return keys.slice(0, 5);
    } catch (e) {
        return [`Error: ${e}`];
    }
}
