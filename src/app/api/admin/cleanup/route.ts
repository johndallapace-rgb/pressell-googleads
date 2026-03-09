import { NextRequest, NextResponse } from 'next/server';
import { cleanupGhostKeys, getCampaignConfig, ensureCanonicalKeys } from '@/lib/config';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    // 1. Auth Check
    const cookieToken = request.cookies.get('admin_token')?.value;
    const authHeader = request.headers.get('Authorization');
    let authorized = false;

    if (cookieToken && await verifyToken(cookieToken)) authorized = true;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === process.env.ADMIN_TOKEN || await verifyToken(token)) authorized = true;
    }

    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cleanup API] Starting KV cleanup & Repair...');
        logger.info('repair', { event: 'REPAIR_STARTED' });
        
        // 1. Cleanup Ghost Keys
        const cleanupResult = await cleanupGhostKeys();
        console.log(`[Cleanup API] Deleted ${cleanupResult.deleted.length} ghost keys.`);
        
        // 2. REPAIR KEYS (Ensure Canonical)
        // Scan all active products and ensure keys exist
        const config = await getCampaignConfig();
        const products = config.products || {};
        const repaired = [];
        const skipped = [];
        const errors = [];
        const slugMismatches = [];

        console.log(`[Cleanup API] Scanning ${Object.keys(products).length} products for canonical key repair...`);
        
        for (const [key, product] of Object.entries(products)) {
            if (!product.slug) continue;
            
            // Ghost Index Detection: If key is vertical:slug but product.slug doesn't match
            // This suggests a rename happened but index wasn't fully cleaned
            if (key.includes(':')) {
                const [v, s] = key.split(':');
                if (s !== product.slug) {
                    slugMismatches.push({ key, slug: product.slug });
                }
            } else {
                 if (key !== product.slug) {
                     slugMismatches.push({ key, slug: product.slug });
                 }
            }

            try {
                // ensureCanonicalKeys handles the check and only writes if missing
                const didRepair = await ensureCanonicalKeys(product, 'Admin-Repair-All');
                if (didRepair) {
                    repaired.push(product.slug);
                } else {
                    skipped.push(product.slug);
                }
            } catch (err: any) {
                errors.push({ slug: product.slug, error: err.message });
            }
        }
        
        logger.info('repair', { 
            event: 'REPAIR_COMPLETE',
            scanned: Object.keys(products).length,
            repaired: repaired.length,
            skipped: skipped.length,
            slugMismatches: slugMismatches.length,
            errors: errors.length,
            ghostsDeleted: cleanupResult.deleted.length
        });
        
        return NextResponse.json({ 
            success: true, 
            message: `Maintenance complete. Deleted ${cleanupResult.deleted.length} ghosts. Repaired ${repaired.length} products. Found ${slugMismatches.length} mismatches.`,
            details: {
                cleanup: cleanupResult,
                repair: {
                    total: Object.keys(products).length,
                    repairedCount: repaired.length,
                    repairedSlugs: repaired,
                    skippedCount: skipped.length,
                    slugMismatches,
                    errorCount: errors.length
                }
            }
        });
    } catch (e: any) {
        console.error('[Cleanup API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}