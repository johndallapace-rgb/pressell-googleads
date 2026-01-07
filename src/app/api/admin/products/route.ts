import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, ProductConfig, updateCampaignConfig } from '@/lib/config';
import { extractYoutubeId } from '@/lib/youtube';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const streamPipeline = promisify(pipeline);

export const runtime = 'nodejs';

async function checkAuth(request: NextRequest) {
    // 1. Check Cookie (Browser)
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken && await verifyToken(cookieToken)) return true;

    // 2. Check Header (API)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Support both JWT and raw ADMIN_TOKEN for flexibility
        if (token === process.env.ADMIN_TOKEN) return true;
        if (await verifyToken(token)) return true;
    }

    return false;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getCampaignConfig();
    return NextResponse.json({ products: config.products || {} });
  } catch (error) {
    console.error('[List Products API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Admin Token
    if (!(await checkAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      vertical, 
      language, 
      template, 
      affiliate_url, 
      official_url, 
      youtube_review_url,
      status,
      set_as_active,
      // Extended fields for AI Import
      headline,
      subheadline,
      bullets,
      google_ads_id,
       google_ads_label,
       support_email,
       image_url,
       pain_points,
      unique_mechanism,
      seo
    } = body;

    // 2. Basic Validation & Safety Lock
    // Explicitly require Affiliate URL and YouTube Review for revenue/conversion safety
    if (!name || !vertical || !affiliate_url || !official_url || !youtube_review_url) {
      return NextResponse.json({ 
          error: 'Missing required fields: Name, Vertical, Affiliate URL, Official URL, and YouTube Review are mandatory.' 
      }, { status: 400 });
    }

    // 3. Generate/Normalize Slug
    // Ensure slug does not conflict with admin routes
    let finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!finalSlug) return NextResponse.json({ error: 'Invalid slug generation' }, { status: 400 });

    const reservedSlugs = ['admin', 'api', 'login', 'dashboard', 'settings', 'analytics', 'diagnostics'];
    if (reservedSlugs.includes(finalSlug)) {
        finalSlug = `${finalSlug}-product`;
    }

    // 4. Extract YouTube ID (Force validation if needed, though frontend handles required)
    const youtubeId = youtube_review_url ? extractYoutubeId(youtube_review_url) : undefined;
    
    // Safety: If no Youtube ID but URL provided, log warning
    if (youtube_review_url && !youtubeId) {
        console.warn('Invalid YouTube URL provided:', youtube_review_url);
    }

    // 4.5 IMAGE DOWNLOAD AUTOMATION
    let finalImageUrl = image_url || `/images/default-${vertical.toLowerCase()}.svg`;
    
    // If image is external URL, download it
    if (finalImageUrl.startsWith('http')) {
        try {
            console.log(`[Auto-Asset] Downloading image from: ${finalImageUrl}`);
            const res = await fetch(finalImageUrl);
            if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
            
            // Determine extension
            const contentType = res.headers.get('content-type');
            let ext = '.jpg';
            if (contentType === 'image/png') ext = '.png';
            if (contentType === 'image/webp') ext = '.webp';
            if (contentType === 'image/svg+xml') ext = '.svg';
            
            // Ensure directory exists
            const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }
            
            const fileName = `${finalSlug}${ext}`;
            const filePath = path.join(publicDir, fileName);
            
            // Save file
            if (res.body) {
                // @ts-ignore - ReadableStream mismatch in Next.js types but works in Node runtime
                await streamPipeline(res.body, fs.createWriteStream(filePath));
                finalImageUrl = `/images/products/${fileName}`;
                console.log(`[Auto-Asset] Image saved to: ${finalImageUrl}`);
            }
        } catch (e) {
            console.error('[Auto-Asset] Failed to download image, keeping remote URL.', e);
            // Fallback: keep remote URL
        }
    }

    // 5. Construct New Product
    const newProduct: ProductConfig = {
      id: randomUUID(), // Generate Unique UUID
      slug: finalSlug,
      name,
      vertical: vertical.toLowerCase(),
      language,
      template: template || 'editorial',
      status: status || 'active',
      platform: 'unknown',
      affiliate_url,
      official_url,
      youtube_review_id: youtubeId || undefined,
      
      // Tracking - ENFORCE GLOBAL PIXEL IF NOT PROVIDED or IF DEFAULT
      // If user clears it, we force it back to default for safety unless explicitly "none"
      google_ads_id: (google_ads_id && google_ads_id.trim() !== '') ? google_ads_id : '17850696537',
      google_ads_label: google_ads_label || undefined,
      support_email: support_email || 'support@topproductofficial.com',

       // Content (Prefer passed values, fallback to defaults)
      image_url: finalImageUrl,
      headline: headline || `${name} Review: Key Facts, Benefits, and Who It’s For`,
      subheadline: subheadline || 'Independent-style overview based on official info and user feedback.',
      cta_text: 'Check Availability',
      
      bullets: bullets || [
        'Supports your goals effectively',
        'Made with quality standards',
        'Satisfaction guarantee available'
      ],
      
      whatIs: {
        title: 'What Is It?',
        content: pain_points ? [`Solves: ${pain_points.join(', ')}`, unique_mechanism || ''] : [`${name} is a popular solution in the ${vertical} market.`]
      },

      faq: [
        { q: `Is ${name} safe to use?`, a: `Always consult the official label and your specialist, but ${name} is generally designed for safety.` },
        { q: 'How long for results?', a: 'Individual results vary, but many users report changes within a few weeks.' }
      ],
      
      seo: seo || {
        title: `${name} Review - Honest Analysis`,
        description: `Read our comprehensive review of ${name}. Does it work? Is it legit?`
      },
      
      // Extended fields
      prosCons: {
        pros: ['Easy to use', 'Transparent ingredients', 'Good feedback'],
        cons: ['Online availability only', 'Limited stock']
      },

      // Auto-Generated Ads Storage
      ads: ((body.google_ads_headlines && body.google_ads_headlines.length > 0) || (body.google_ads_negatives && body.google_ads_negatives.length > 0)) ? {
          status: 'ready',
          campaigns: [{
              campaignName: `${name} - Search - ${vertical.toUpperCase()}`,
              adGroups: [{
                  name: 'General Interest',
                  keywords: [`${name} reviews`, `buy ${name}`, `${name} price`],
                  negativeKeywords: body.google_ads_negatives || [],
                  ads: (body.google_ads_headlines && body.google_ads_headlines.length > 0) ? [{
                      headlines: body.google_ads_headlines,
                      descriptions: body.google_ads_descriptions || [],
                      finalUrl: official_url
                  }] : []
              }]
          }]
      } : undefined
    };

    // 6. Fetch Current Config & Merge
    const currentConfig = await getCampaignConfig();
    
    // Ensure products object exists
    if (!currentConfig.products) currentConfig.products = {};

    // CLEANUP: Remove old 'undefined' or null keys to save space
    if (currentConfig.products) {
        Object.keys(currentConfig.products).forEach(key => {
            if (key === 'undefined' || key === 'null' || !currentConfig.products[key]) {
                delete currentConfig.products[key];
            }
        });
    }
    
    // Add/Overwrite product
    currentConfig.products[finalSlug] = newProduct;

    // Optional: Set as Active
    if (set_as_active) {
      currentConfig.active_product_slug = finalSlug;
    }

    // 7. Save to Edge Config (Upsert)
    const result = await updateCampaignConfig(currentConfig);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save to Edge Config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug: finalSlug });

  } catch (error) {
    console.error('[Create Product API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug/ID is required' }, { status: 400 });
    }

    console.log(`[Delete API] Request to delete: ${slug}`);

    // 1. Get Config
    const currentConfig = await getCampaignConfig();
    const cfgAny = currentConfig as any;
    
    // 2. Find Key to Delete
    let keyToDelete: string | null = null;
    let location: 'products' | 'root' | null = null;

    // A. Check products object (Standard)
    if (currentConfig.products && currentConfig.products[slug]) {
        keyToDelete = slug;
        location = 'products';
    }
    // B. Check products object by Value (ID/Slug match)
    else if (currentConfig.products) {
        const foundKey = Object.keys(currentConfig.products).find(k => {
            const p = currentConfig.products[k];
            return p.slug === slug || p.id === slug || k === slug;
        });
        if (foundKey) {
            keyToDelete = foundKey;
            location = 'products';
        }
    }

    // C. Check Root (Legacy Formato B)
    if (!keyToDelete && cfgAny[slug]) {
        keyToDelete = slug;
        location = 'root';
    }

    if (!keyToDelete) {
        console.warn(`[Delete API] Product not found: ${slug}`);
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log(`[Delete API] Deleting key: ${keyToDelete} from ${location}`);

    // 3. Delete from Config
    if (location === 'products') {
        delete currentConfig.products[keyToDelete];
    } else {
        delete cfgAny[keyToDelete];
    }
    
    // If active, unset it
    if (currentConfig.active_product_slug === slug || currentConfig.active_product_slug === keyToDelete) {
        currentConfig.active_product_slug = '';
    }

    // 4. Save Config
    const result = await updateCampaignConfig(currentConfig);
    if (!result.success) {
        throw new Error(result.error);
    }

    // 5. Delete Image (Best Effort)
    try {
        const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
        const extensions = ['.jpg', '.png', '.webp', '.svg'];
        
        // Try deleting by slug and key
        const namesToCheck = [slug, keyToDelete];
        
        for (const name of namesToCheck) {
            for (const ext of extensions) {
                const filePath = path.join(publicDir, `${name}${ext}`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[Delete] Removed image: ${filePath}`);
                }
            }
        }
    } catch (e) {
        console.warn('[Delete] Failed to delete image files:', e);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Delete Product API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
