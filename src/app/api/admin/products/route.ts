import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, ProductConfig, updateCampaignConfig } from '@/lib/config';
import { extractYoutubeId } from '@/lib/youtube';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Admin Token
    // We can use a simpler check or the same verifyToken helper if available in context,
    // but for GET listing, we might want to ensure it's protected too.
    // However, the frontend usually sends the token in Authorization header or we rely on cookies if verifyToken reads them.
    // Let's assume we need to verify token from cookie for GET requests as per other routes.
    const token = request.cookies.get('admin_token')?.value;
    // Note: The POST method used Authorization header manually, but verifyToken is better.
    // Let's use verifyToken from '@/lib/auth' if possible, similar to other routes.
    // But since I don't want to break existing imports if not present, let's check imports.
    // I see `import { getCampaignConfig ... } from '@/lib/config';`
    // I don't see `verifyToken` imported. Let's add it if we want strict security, 
    // or just rely on the fact that this is an admin route.
    // For consistency with the POST method which checks `request.headers.get('Authorization')`,
    // I will use a similar check or the cookie check. 
    // Actually, looking at the POST method, it checks `process.env.ADMIN_TOKEN`.
    // Let's do the same for GET for now to be safe, or check cookie if called from browser.
    
    // Better: Check cookie for browser access
    const { verifyToken } = await import('@/lib/auth');
    if (token && await verifyToken(token)) {
        // authorized via cookie
    } else {
        // fallback to header check (for API calls)
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
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
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
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
      ads: (body.google_ads_headlines && body.google_ads_headlines.length > 0) ? {
          status: 'ready',
          campaigns: [{
              campaignName: `${name} - Search - ${vertical.toUpperCase()}`,
              adGroups: [{
                  name: 'General Interest',
                  keywords: [`${name} reviews`, `buy ${name}`, `${name} price`],
                  ads: [{
                      headlines: body.google_ads_headlines,
                      descriptions: body.google_ads_descriptions || [],
                      finalUrl: official_url
                  }]
              }]
          }]
      } : undefined
    };

    // 6. Fetch Current Config & Merge
    const currentConfig = await getCampaignConfig();
    
    // Ensure products object exists
    if (!currentConfig.products) currentConfig.products = {};
    
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
