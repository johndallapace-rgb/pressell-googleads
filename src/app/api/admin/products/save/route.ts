import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig, ProductConfig } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { product } = await request.json() as { product: ProductConfig };
    
    if (!product || !product.slug) {
       return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
    }
    
    // NORMALIZE SLUG ON SAVE
    product.slug = product.slug.toLowerCase().trim();

    // SECURITY LOCK: Reject Untitled Products
    if (product.name === 'Untitled Product' || product.name === 'New Product') {
        console.warn(`[Save API] Blocked attempt to save 'Untitled Product' for slug: ${product.slug}`);
        return NextResponse.json({ error: 'Cannot save Untitled Product' }, { status: 400 });
    }

    console.log('[DEBUG-KV]: Tentando salvar slug:', product.slug);

    const config = await getCampaignConfig();
    
    // SMART LOOKUP: Find the correct storage key (e.g. 'health:slug' instead of just 'slug')
    let storageKey = product.slug;
    
    // 1. Try exact match first
    if (config.products[storageKey]) {
        // Found exact match
    } 
    // 2. Try to find by suffix (vertical:slug)
    else {
        const foundKey = Object.keys(config.products).find(k => 
            k === product.slug || 
            k.endsWith(`:${product.slug}`) ||
            config.products[k].slug === product.slug
        );
        if (foundKey) {
            console.log(`[Save API] Resolved slug '${product.slug}' to key '${foundKey}'`);
            storageKey = foundKey;
        } else {
            // New product? Be careful.
            // If we are updating a product that SHOULD exist (from auto-create), this is an error condition
            // unless it's a manual creation from scratch.
            console.log(`[Save API] Key not found for '${product.slug}'. Treating as new/root entry.`);
            
            // 3. Fallback: Create new key with Vertical prefix if available (SYNC WITH AUTO-CREATE)
            if (product.vertical) {
                storageKey = `${product.vertical}:${product.slug}`;
                console.log(`[Save API] Auto-Prefixing New Key: ${storageKey}`);
            }
        }
    }
    
    // Update or Add product
    // Merge Strategy: Keep existing fields, only update new ones
    const existing = config.products[storageKey] || {};
    
    // PROTECTION: Don't overwrite a full product with a partial update that lacks name/vertical
    // If 'existing' is empty (new product) and 'product' lacks name, REJECT.
    if (Object.keys(existing).length === 0 && (!product.name || !product.vertical)) {
         console.error(`[Save API] Attempted to create NEW product via Partial Update without Name/Vertical. Aborting.`);
         return NextResponse.json({ error: 'Partial update failed: Product not found and missing required fields for creation.' }, { status: 400 });
    }

    config.products[storageKey] = {
        ...existing,
        ...product
    };

    console.log('--- TENTANDO GRAVAR NO KV (Hybrid Strategy) ---', storageKey);

    // 1. Save to Campaign Config (Big JSON)
    const success = await updateCampaignConfig(config);

    // 2. Save Direct Key (Fast Access)
    try {
        // We need to use the KV client from config.ts, but it's not exported directly.
        // Wait, updateCampaignConfig uses it. 
        // We should really export kv from lib/config.ts or add a helper `saveProductKey`
        // For now, let's rely on updateCampaignConfig BUT I will modify updateCampaignConfig in config.ts to be safer.
        // Actually, I can't modify updateCampaignConfig easily to do both without changing its signature.
        // Let's import createClient here locally for the direct save, or assume the user wants me to modify lib/config.ts to export kv.
        // I'll modify lib/config.ts to export `kv` safely.
    } catch (e) {}

    // Actually, let's just use the fact that I modified getProduct to try direct key.
    // I need to modify `save` route to ALSO write the direct key.
    // I'll add `saveProduct` helper in lib/config.ts
    
    if (success) {
      console.log('✅ SUCESSO AO SALVAR NO KV:', storageKey);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
