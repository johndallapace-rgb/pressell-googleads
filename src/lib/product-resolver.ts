import { kv, getCampaignConfig, ProductConfig } from '@/lib/config';
import { logger } from '@/lib/logger';

// Resolution Result Interface
export interface ProductResolution {
    found: boolean;
    product: ProductConfig | null;
    source: 'primary' | 'canonical' | 'index' | 'brute-force' | 'none';
    attemptedKeys: string[];
    detectedVertical: string | null;
    visibility: 'public' | 'blocked' | 'missing';
    blockReason: 'offline' | 'paused' | 'draft' | 'inactive' | null;
    resolutionLog?: any; // For debugging
}

// Resolver Options
interface ResolverOptions {
    slug: string;
    vertical?: string | null;
    allowInactive?: boolean;
}

/**
 * Universal Product Resolver
 * Centralizes the logic for finding a product by slug across KV and Config.
 * 
 * Order of operations:
 * 1. Primary Key (vertical:slug) - if vertical is provided
 * 2. Canonical Key (slug)
 * 3. Config Index Lookup (vertical:slug then slug)
 * 4. Brute Force Scan (config values)
 */
export async function resolveProductBySlug({ 
    slug, 
    vertical = null,
    allowInactive = false 
}: ResolverOptions): Promise<ProductResolution> {
    
    const attemptedKeys: string[] = [];
    
    // 1. Try Primary Key (Vertical + Slug)
    if (vertical && kv) {
        const primaryKey = `${vertical}:${slug}`;
        attemptedKeys.push(primaryKey);
        try {
            const product = await kv.get<ProductConfig>(primaryKey);
            if (product && typeof product === 'object') {
                return validateAndReturn(product, 'primary', attemptedKeys, vertical);
            }
        } catch (e) {
            console.error('[Resolver] Primary KV Error:', e);
        }
    }

    // 2. Try Canonical Key (Slug only)
    if (kv) {
        attemptedKeys.push(slug);
        try {
            const product = await kv.get<ProductConfig>(slug);
            if (product && typeof product === 'object') {
                return validateAndReturn(product, 'canonical', attemptedKeys, vertical);
            }
        } catch (e) {
            console.error('[Resolver] Canonical KV Error:', e);
        }
    }

    // 3. Try Config Index (Memory/Fallback)
    // This handles cases where KV might be down or key is missing but index has it.
    try {
        const config = await getCampaignConfig();
        const products = config?.products || {};
        
        // Try vertical:slug in index
        if (vertical) {
            const indexKey = `${vertical}:${slug}`;
            attemptedKeys.push(`index:${indexKey}`);
            if (products[indexKey]) {
                return validateAndReturn(products[indexKey], 'index', attemptedKeys, vertical);
            }
        }

        // Try slug in index
        attemptedKeys.push(`index:${slug}`);
        if (products[slug]) {
            return validateAndReturn(products[slug], 'index', attemptedKeys, vertical);
        }

        // 4. Brute Force Scan (Rescue)
        // If vertical was wrong or missing, scan all products for matching slug property
        attemptedKeys.push('brute-force-scan');
        const found = Object.values(products).find((p: any) => {
            if (!p || typeof p !== 'object') return false;
            return p.slug === slug;
        });

        if (found) {
            return validateAndReturn(found as ProductConfig, 'brute-force', attemptedKeys, vertical);
        }

    } catch (e) {
        console.error('[Resolver] Config/Index Error:', e);
    }

    // 5. Not Found
    return {
        found: false,
        product: null,
        source: 'none',
        attemptedKeys,
        detectedVertical: vertical,
        visibility: 'missing',
        blockReason: null
    };
}

/**
 * Helper to validate status and shape response
 */
function validateAndReturn(
    product: ProductConfig, 
    source: ProductResolution['source'], 
    attemptedKeys: string[],
    detectedVertical: string | null
): ProductResolution {
    const isActive = product.status === 'active';
    const blockReason = isActive ? null : (product.status as any);
    
    // Log resolution success locally
    logger.info('public-route', {
        event: 'PRODUCT_RESOLVED',
        slug: product.slug,
        source,
        status: product.status
    });

    return {
        found: true,
        product,
        source,
        attemptedKeys,
        detectedVertical,
        visibility: isActive ? 'public' : 'blocked',
        blockReason
    };
}
