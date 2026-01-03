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

    // Check for nested structure
    const effectiveConfig = config.campaign_config || config;

    const productsRaw = effectiveConfig.products || {};
    const normalizedProducts: Record<string, ProductConfig> = {};

    // Validate each product
    try {
        Object.entries(productsRaw).forEach(([slug, prod]: [string, any]) => {
            if (typeof prod === 'object' && prod !== null) {
                 normalizedProducts[slug] = {
                     ...prod,
                     name: prod.name || slug,
                     status: prod.status || 'paused',
                     affiliate_url: prod.affiliate_url || '',
                     official_url: prod.official_url || '',
                     slug: slug
                 } as ProductConfig;
            }
        });
    } catch (e) {
        console.error('Error normalizing products:', e);
    }

    return {
        active_product_slug: effectiveConfig.active_product_slug || defaultConfig.active_product_slug,
        default_lang: effectiveConfig.default_lang || defaultConfig.default_lang,
        products: Object.keys(normalizedProducts).length > 0 ? normalizedProducts : defaultConfig.products
    };
}

/**
 * Fetches campaign configuration from Edge Config or falls back to local default.
 * Uses dynamic import to avoid top-level side effects.
 */
export async function getCampaignConfig(): Promise<CampaignConfig> {
    if (!process.env.EDGE_CONFIG) {
        console.warn('EDGE_CONFIG env var missing, using default.');
        return defaultConfig;
    }

    try {
        const { createClient } = await import('@vercel/edge-config');
        const client = createClient(process.env.EDGE_CONFIG);
        
        // Try reading the wrapper key first
        const campaignConfig = await client.get('campaign_config');
        
        if (campaignConfig) {
            return normalizeConfig(campaignConfig);
        }

        // If not found, try reading separate keys
        // Note: client.getAll() might be expensive or not what we want. 
        // Better to fetch specific known keys if wrapper fails.
        // But request says "read separately".
        const [activeSlug, defaultLang, products] = await Promise.all([
            client.get('active_product_slug'),
            client.get('default_lang'),
            client.get('products')
        ]);

        if (activeSlug || products) {
            return normalizeConfig({
                active_product_slug: activeSlug,
                default_lang: defaultLang,
                products: products
            });
        }

        console.warn('No valid config found in Edge Config, using default.');
        return defaultConfig;

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
