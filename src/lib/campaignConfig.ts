import { defaultConfig } from '@/data/defaultConfig';
import { CampaignConfig, ProductConfig } from '@/lib/config';

/**
 * Normalizes configuration input which might be a JSON string or an object.
 */
export function normalizeConfig(raw: any): CampaignConfig {
    if (!raw) return defaultConfig;
    
    let config = raw;
    if (typeof config === 'string') {
        try { config = JSON.parse(config); } 
        catch (e) { console.error('Error parsing config JSON:', e); return defaultConfig; }
    }
    
    if (typeof config !== 'object') return defaultConfig;

    // Merge logic: support both formats (root keys vs products object)
    return {
        ...defaultConfig,
        ...config,
        products: {
            ...defaultConfig.products,
            ...(config.products || {})
        }
    };
}

/**
 * Fetches campaign configuration from Edge Config or falls back to local default.
 * Uses dynamic import to avoid top-level side effects.
 */
export async function getCampaignConfig(): Promise<CampaignConfig> {
    if (!process.env.EDGE_CONFIG) {
        return defaultConfig;
    }

    try {
        const { createClient } = await import('@vercel/edge-config');
        const client = createClient(process.env.EDGE_CONFIG);
        const raw = await client.get('campaign_config');
        return normalizeConfig(raw);
    } catch (error) {
        console.error('Error fetching from Edge Config:', error);
        return defaultConfig;
    }
}

/**
 * Resolves a product by slug, supporting both config formats.
 */
export function getProductBySlug(config: CampaignConfig, slug: string): ProductConfig | null {
    const cfgAny = config as any;
    // Priority: products object -> root object
    return cfgAny.products?.[slug] ?? cfgAny?.[slug] ?? null;
}

/**
 * Extracts all available product keys from the configuration.
 */
export function getKeysFound(config: CampaignConfig): string[] {
    const cfgAny = config as any;
    const productsObj = cfgAny.products || {};
    const productKeys = Object.keys(productsObj);
    
    // Root keys (Format B), excluding known non-product keys
    const knownKeys = ['active_product_slug', 'default_lang', 'products'];
    const rootKeys = Object.keys(cfgAny).filter(k => 
        !knownKeys.includes(k) && 
        typeof cfgAny[k] === 'object' &&
        cfgAny[k]?.slug 
    );

    return Array.from(new Set([...productKeys, ...rootKeys]));
}
