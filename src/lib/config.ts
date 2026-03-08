import { createClient } from '@vercel/kv';
import { defaultConfig } from '@/data/defaultConfig';
import { logger } from '@/lib/logger'; // Import local logger

// ... (existing imports and KV setup) ...

export async function saveProduct(product: ProductConfig, source: string = 'Generic'): Promise<boolean> {
    if (!kv || !product.slug) return false;

    // Concurrency Lock
    const lockKey = `lock:save:${product.vertical || 'generic'}:${product.slug}`;
    let lockAcquired = false;

    try {
        // Try to acquire lock with 15s TTL
        // nx: true ensures we only set if key doesn't exist
        // ex: 15 sets expiration in seconds
        const result = await kv.set(lockKey, 'locked', { nx: true, ex: 15 });
        lockAcquired = result === 'OK' || result === 1 || result === true; // Vercel KV returns 'OK' or 1 depending on client

        if (!lockAcquired) {
            console.warn(`[SAVE_LOCK_SKIPPED] Lock held for ${product.slug}`, { source });
            // Log local event
            logger.info('save-product', { event: 'SAVE_LOCK_SKIPPED', slug: product.slug, source, reason: 'Lock held' });
            // Fail gracefully - another save is in progress
            return false;
        }

        console.log(`[SAVE_LOCK_ACQUIRED] ${product.slug}`, { source });
        logger.info('save-product', { event: 'SAVE_LOCK_ACQUIRED', slug: product.slug, source });

        // Determine Primary Key (Vertical-Prefixed)
        let key = product.slug;
        if (product.vertical) {
             key = `${product.vertical}:${product.slug}`;
        }
        
        console.log(`[SAVE_PRODUCT]`, {
            source,
            vertical: product.vertical,
            slug: product.slug,
            key: key
        });
        
        logger.save({ 
            source, 
            vertical: product.vertical, 
            slug: product.slug, 
            key, 
            status: 'attempting' 
        });
        
        // 1. Save to Primary Key (Side A - Prefixed)
        try {
            await kv.set(key, product);
        } catch (error: any) {
            console.error("[SAVE_PRODUCT_ERROR]", {
                source,
                vertical: product.vertical,
                slug: product.slug,
                key: key,
                error: error?.message
            });
            logger.error('save-product', { 
                event: 'SAVE_PRODUCT_ERROR', 
                source, 
                slug: product.slug, 
                key, 
                error: error?.message 
            });
            throw error; // Propagate error to outer catch block which returns false
        }
        
        // 2. Save to Canonical Key (Side A - Global Slug) - BACKFILL FIX
        try {
            await kv.set(product.slug, product);
        } catch (error: any) {
             console.error("[SAVE_PRODUCT_FALLBACK_ERROR]", {
                source,
                slug: product.slug,
                key: product.slug,
                error: error?.message
             });
             logger.warn('save-product', { 
                event: 'SAVE_PRODUCT_FALLBACK_ERROR', 
                source, 
                slug: product.slug, 
                key: product.slug, 
                error: error?.message 
             });
             // Do NOT throw here to allow partial success if primary key worked
        }
        
        if (key !== product.slug) {
             console.log(`[SAVE_PRODUCT_FALLBACK]`, {
                source,
                slug: product.slug,
                key: product.slug
             });
             logger.save({ 
                source, 
                slug: product.slug, 
                key: product.slug, 
                status: 'fallback_saved' 
             });
        }
        
        logger.save({ 
            source, 
            slug: product.slug, 
            key, 
            status: 'success' 
        });

        return true;
    } catch (e: any) {
        // This catch block handles the re-thrown error from primary key or unexpected errors
        // DO NOT log here again, as we logged structured error above for primary failure.
        // But if it was an unexpected error outside the try blocks (e.g. log formatting), we should log.
        if (!e.message?.includes('SAVE_PRODUCT_ERROR')) {
             console.error('[KV-Save] Unexpected Error:', e);
             logger.error('save-product', { event: 'SAVE_UNEXPECTED_ERROR', error: e.message, source });
        }
        return false;
    } finally {
        // Release Lock
        if (lockAcquired) {
            try {
                await kv.del(lockKey);
                console.log(`[SAVE_LOCK_RELEASED] ${product.slug}`);
                logger.info('save-product', { event: 'SAVE_LOCK_RELEASED', slug: product.slug });
            } catch (e: any) {
                console.error('[SAVE_LOCK_ERROR] Failed to release lock', e);
                logger.error('save-product', { event: 'SAVE_LOCK_ERROR', slug: product.slug, error: e.message });
            }
        }
    }
}

// ... (updateCampaignConfig, deleteProductKey, cleanupGhostKeys) ...

// Self-Heal logging
export async function ensureCanonicalKeys(product: ProductConfig, source: string = 'Self-Heal'): Promise<boolean> {
    if (!kv || !product.slug) return false;

    // Safety Check: Only repair if product looks valid
    if (!product.vertical || product.status !== 'active') {
        // console.log(`[SELF_HEAL_SKIP] Product ${product.slug} invalid or inactive.`, { source });
        return false;
    }

    const verticalKey = `${product.vertical}:${product.slug}`;
    const slugKey = product.slug;

    try {
        // Check existence without fetching full data to save bandwidth
        // Using exists() is efficient
        const existsVertical = await kv.exists(verticalKey);
        const existsSlug = await kv.exists(slugKey);

        if (existsVertical && existsSlug) {
            // All good, no repair needed
            return true;
        }

        console.log(`[SELF_HEAL_TRIGGERED] Missing keys for ${product.slug}. Repairing...`, {
            missingVertical: !existsVertical,
            missingSlug: !existsSlug,
            source
        });
        
        logger.info('self-heal', { 
            event: 'SELF_HEAL_TRIGGERED', 
            slug: product.slug, 
            source,
            missingVertical: !existsVertical,
            missingSlug: !existsSlug
        });

        // Use standard save to repair
        // This writes both keys and logs structured success/error
        await saveProduct(product, source);

        console.log(`[SELF_HEAL_SUCCESS] Repaired keys for ${product.slug}`, { source });
        logger.info('self-heal', { event: 'SELF_HEAL_SUCCESS', slug: product.slug, source });
        return true;

    } catch (e: any) {
        console.error(`[SELF_HEAL_ERROR] Failed to repair ${product.slug}`, {
            error: e.message,
            source
        });
        logger.error('self-heal', { event: 'SELF_HEAL_ERROR', slug: product.slug, error: e.message, source });
        return false;
    }
}
