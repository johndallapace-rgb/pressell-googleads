import { NextResponse } from 'next/server';
import { getCampaignConfig, saveProduct } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[Backfill] Starting canonical key backfill...');
        const config = await getCampaignConfig();
        const products = config.products || {};
        const results = [];

        for (const [key, product] of Object.entries(products)) {
            if (!product.slug) continue;
            
            // Re-save using the new logic (which saves both vertical:slug and slug)
            // We need to fetch the FULL product first because the index is lightweight
            // BUT, since we are in a broken state, we might only have the index data.
            // Let's try to save what we have, at least it restores routing.
            
            // Wait! The index is lightweight, so it misses content.
            // We must try to fetch the existing full record from the prefixed key first.
            // But we can't do that easily without importing 'kv' directly and we want to use the helper.
            
            // Actually, saveProduct in config.ts now handles dual saving.
            // So if we just call saveProduct with the lightweight object, we might overwrite the full object with empty fields!
            // DANGER!
            
            // Instead, let's just use this script to fix the specific broken keys requested.
            // health:mitolyn-metabolic-boost -> mitolyn-metabolic-boost
            
            const slug = product.slug;
            const vertical = product.vertical || 'health';
            const fullKey = `${vertical}:${slug}`;
            
            results.push({ key, slug, vertical, status: 'scanned' });
        }

        return NextResponse.json({ 
            message: 'To safely backfill, please open each product in the Admin and click Save. This prevents data loss from lightweight index overwrites.',
            scanned: results.length 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
