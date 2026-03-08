import { createClient } from '@vercel/kv';
import { defaultConfig } from '@/data/defaultConfig';
import { logger } from '@/lib/logger';

// =========================
// Types
// =========================
export type ProductConfig = {
  slug: string;
  vertical?: string;
  status?: string;
  name?: string;
  [key: string]: any;
};

export type CampaignConfig = {
  products?: Record<string, ProductConfig>;
  [key: string]: any;
};

// =========================
// KV Setup
// =========================
const kv =
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
    lockAcquired = result === 'OK' || result === 1 || result === true;

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
}