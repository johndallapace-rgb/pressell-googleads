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

    // Merge products from Edge Config with defaultConfig to ensure new file-based products appear
    // even if Edge Config is stale.
    const edgeProducts = effectiveConfig.products || {};
    const defaultProducts = defaultConfig.products || {};
    
    // Union of keys
    const allKeys = new Set([...Object.keys(edgeProducts), ...Object.keys(defaultProducts)]);
    
    const normalizedProducts: Record<string, ProductConfig> = {};

    // Validate each product
    try {
        allKeys.forEach((key) => {
            const edgeProd = edgeProducts[key];
            const defaultProd = defaultProducts[key];
            
            // If exists in both, Edge wins (dynamic updates). 
            // If only in default (new deployment), default wins.
            const incoming = edgeProd || defaultProd;
            
            if (typeof incoming === 'object' && incoming !== null) {
                 const slug = (incoming.slug || key).trim();
                 
                 // Base is always defaultProd if available (for structure), or fallback
                 const base = defaultProd || {
                    slug,
                    name: slug,
                    platform: 'unknown',
                    language: effectiveConfig.default_lang || 'en',
                    status: 'paused',
                    vertical: 'health',
                    template: 'editorial',
                    official_url: '',
                    affiliate_url: '',
                    youtube_review_id: '',
                    image_url: '/images/placeholder.svg',
                    headline: '',
                    subheadline: '',
                    cta_text: 'Check Availability',
                    bullets: [],
                    faq: [],
                    seo: { title: '', description: '' },
                    whatIs: { title: '', content: [] },
                    howItWorks: { title: '', content: [] },
                    prosCons: { pros: [], cons: [] }
                 };

                 normalizedProducts[slug] = {
                    ...base,
                    ...incoming,
                    slug,
                    // Ensure critical fields are not overwritten by empty strings if base has them
                    status: String(incoming.status || base.status).toLowerCase().trim() as 'active' | 'paused',
                    vertical: String(incoming.vertical || base.vertical).toLowerCase().trim() as any,
                    template: incoming.template || base.template || 'editorial',
                    affiliate_url: incoming.affiliate_url || base.affiliate_url || '',
                    official_url: incoming.official_url || base.official_url || '',
                    image_url: incoming.image_url || incoming.image || base.image_url || '/images/placeholder.svg',
                    headline: incoming.headline || base.headline || `${incoming.name || base.name || slug} Review`,
                    subheadline: incoming.subheadline || base.subheadline || '',
                    cta_text: incoming.cta_text || base.cta_text || 'Check Availability',
                    bullets: Array.isArray(incoming.bullets) ? incoming.bullets : (Array.isArray(base.bullets) ? base.bullets : []),
                    faq: Array.isArray(incoming.faq) ? incoming.faq : (Array.isArray(base.faq) ? base.faq : []),
                    seo: {
                        title: incoming?.seo?.title || base?.seo?.title || '',
                        description: incoming?.seo?.description || base?.seo?.description || ''
                    },
                    whatIs: incoming.whatIs || base.whatIs,
                    howItWorks: incoming.howItWorks || base.howItWorks,
                    prosCons: incoming.prosCons || base.prosCons
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
    return config.products[slug] || null;
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
