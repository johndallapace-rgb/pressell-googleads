import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig, saveProduct, ProductConfig, kv } from '@/lib/config';
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

    // SANITIZE AFFILIATE URL (Remove trailing { if present)
    if (product.affiliate_url) {
        product.affiliate_url = product.affiliate_url.replace(/\{$/, '');
    }

    // SECURITY LOCK: Reject Untitled Products
    if (product.name === 'Untitled Product' || product.name === 'New Product') {
        return NextResponse.json({ error: 'Cannot save Untitled Product' }, { status: 400 });
    }

    // 1. Determine Storage Key
    let storageKey = product.slug;
    if (product.vertical) {
        storageKey = `${product.vertical}:${product.slug}`;
    }

    console.log(`[Save API] Saving product to key: ${storageKey}`);

    // 2. Save FULL Product to KV (Side A - Content)
    // This ensures the product page has all data (bullets, content, etc.)
    await saveProduct(product);
    
    // DIRECT KV SAVE (Safety Net)
    if (kv) {
        console.log(`[Save API] Direct KV Set for key: ${storageKey}`);
        await kv.set(storageKey, product);
    }

    // 3. Update Campaign Config Index (Side B - Directory)
    // This ensures the product appears in the Admin List
    const config = await getCampaignConfig();
    
    // Ensure products structure exists
    if (!config.products) config.products = {};

    // Find if we need to clean up old keys (e.g. if vertical changed)
    // We do a quick scan for the slug
    const oldKey = Object.keys(config.products).find(k => k.endsWith(`:${product.slug}`) || k === product.slug);
    if (oldKey && oldKey !== storageKey) {
        console.log(`[Save API] Removing old key index: ${oldKey}`);
        delete config.products[oldKey];
    }

    // Create Lightweight Index Entry
    // CRITICAL: Ensure 'name' is preserved for the Admin Dashboard
    config.products[storageKey] = {
        ...product,
        name: product.name || config.products[storageKey]?.name || 'Untitled Product', // Fallback to existing or default
        slug: storageKey.includes(':') ? storageKey.split(':')[1] : storageKey, // Ensure clean slug
        vertical: product.vertical || 'health',
        // STRIP HEAVY FIELDS for the index
        whatIs: undefined,
        howItWorks: undefined,
        prosCons: undefined,
        testimonials: undefined,
        faq: undefined,
        bullets: undefined,
        headline: undefined,
        subheadline: undefined,
        ads: undefined,
        seo: undefined
    };

    const success = await updateCampaignConfig(config);
    
    if (success) {
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    } else {
      return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
