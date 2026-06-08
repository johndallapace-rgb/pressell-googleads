import { CampaignConfig, ProductConfig } from '@/lib/shared/config';
import { serverLogger as logger } from '@/lib/server/logger';

interface ProductIndex {
  bySlug: Map<string, ProductConfig>;
  byVerticalSlug: Map<string, ProductConfig>; // "health:mitolyn" -> Product
  all: ProductConfig[];
  timestamp: number;
  count: number;
}

// Persist index across invocations in warm environment
let indexCache: ProductIndex | null = null;

export const productIndex = {
  
  /**
   * Rebuild indexes from config
   */
  rebuild(config: CampaignConfig) {
    const products = config.products || {};
    const bySlug = new Map<string, ProductConfig>();
    const byVerticalSlug = new Map<string, ProductConfig>();
    const all: ProductConfig[] = [];

    for (const [key, product] of Object.entries(products) as [string, ProductConfig][]) {
      if (!product || !product.slug) continue;

      // Add to 'all'
      all.push(product);

      // Index by slug
      if (!bySlug.has(product.slug)) {
        bySlug.set(product.slug, product);
      }

      // Index by vertical:slug (Canonical Key)
      if (product.vertical) {
        const canonicalKey = `${product.vertical}:${product.slug}`;
        byVerticalSlug.set(canonicalKey, product);
      }
      
      // Also index by the raw key from config if it differs
      if (key !== product.slug && key.includes(':')) {
          byVerticalSlug.set(key, product);
      }
    }

    indexCache = {
      bySlug,
      byVerticalSlug,
      all,
      timestamp: Date.now(),
      count: all.length
    };

    logger.info('system', 'PRODUCT_INDEX_REBUILT', `Indexed ${all.length} products`);
  },

  /**
   * Get product from in-memory index
   */
  get(slug: string, vertical?: string): ProductConfig | null {
    if (!indexCache) return null;

    // 1. Try Vertical:Slug (Specific)
    if (vertical) {
      const key = `${vertical}:${slug}`;
      const found = indexCache.byVerticalSlug.get(key);
      if (found) return found;
    }

    // 2. Try Slug (Generic)
    const found = indexCache.bySlug.get(slug);
    if (found) {
        if (vertical && found.vertical && found.vertical !== vertical) {
            return null;
        }
        return found;
    }

    return null;
  },

  getAll(): ProductConfig[] {
    return indexCache?.all || [];
  },

  isReady(): boolean {
    return !!indexCache && indexCache.count > 0;
  },
  
  getCount(): number {
      return indexCache?.count || 0;
  }
};
