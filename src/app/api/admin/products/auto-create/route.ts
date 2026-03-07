import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';
import { scrapeAndClean } from '@/lib/scraper';
import { getCampaignConfig, ProductConfig, updateCampaignConfig } from '@/lib/config';
import { addAsset } from '@/lib/assets'; // Import Asset Manager
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import negativeKeywords from '@/data/negative-keywords.json';
import productCatalog from '@/data/product-catalog.json';

import { findOfficialUrl } from '@/lib/web-search'; // Import Web Search

const streamPipeline = promisify(pipeline);
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    const authHeader = request.headers.get('Authorization');
    
    // Auth Check
    if ((!token || !(await verifyToken(token))) && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { importUrl, name, competitorAds, country, vertical, affiliate_url, google_ads_id, image_url, video_url, sales_page_image_url, digistore_product_id } = await request.json();
    
    // ... validation logic ...
    
    return await handleCreation(request, importUrl, name, competitorAds, country, vertical, affiliate_url, google_ads_id, image_url, video_url, sales_page_image_url, digistore_product_id);
  } catch (error: any) {
    console.error('[Auto-Create] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function resolveUrl(url: string, productName: string): Promise<string> {
    if (!url || url.length < 5) return url;

    // Helper to get final URL
    const getFinal = async (u: string): Promise<string | null> => {
        try {
            const res = await fetch(u, { 
                method: 'GET', // GET follows redirects better than HEAD sometimes for final URL extraction
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                redirect: 'follow'
            });
            if (res.ok) return res.url;
            return null;
        } catch { return null; }
    };

    // 1. Try resolving the provided URL (Affiliate or Import)
    const resolved = await getFinal(url);
    if (resolved) return resolved;

    // 2. Try Variations (only if original failed, but if we are using affiliate link, we expect it to work)
    const variations = [
        url.replace(/\/$/, '') + '/video.php',
        url.replace(/\/$/, '') + '/vsl',
        url.replace(/\/$/, '') + '/welcome',
        url.replace(/\/$/, '') + '/text.php',
        url.replace(/\/$/, '') + '/en'
    ];

    for (const v of variations) {
        const vResolved = await getFinal(v);
        if (vResolved) {
            console.log(`[Auto-Create] Resolved URL variation: ${vResolved}`);
            return vResolved;
        }
    }

    // 3. Fallback Search
    console.warn(`[Auto-Create] URL ${url} is unreachable. Attempting fallback search...`);
    const fallback = await findOfficialUrl(productName);
    if (fallback) {
        console.log(`[Auto-Create] Fallback URL found: ${fallback}`);
        return fallback;
    }

    return url; // Return original if all else fails
}

async function handleCreation(request: NextRequest, importUrl: string, name: string, competitorAds: string, country: string, userVertical?: string, affiliate_url?: string, google_ads_id?: string, manual_image_url?: string, video_url?: string, sales_page_image_url?: string, digistore_product_id?: string) {
    // 0. Source Selection (Affiliate Priority)
    let sourceUrl = importUrl;
    let isAffiliateSource = false;

    // SAFETY FIX: Digistore24 Universal Link Logic (URL + #aff=JohnPace)
    if (affiliate_url && (affiliate_url.includes('digistore24') || affiliate_url.includes('claudiacaldwell') || affiliate_url.includes('aff='))) {
         // USER MANDATE: "Fim dos IDs Numéricos" & "Lógica de Sufixo Automático"
         // If it's a Digistore product, we prefer the structure: [OFFICIAL_URL]#aff=JohnPace
         
         let cleanUrl = affiliate_url;
         
         // 1. If it's a /redir/ link, we might want to resolve it, BUT user said "Mantenha a URL original intacta" 
         // UNLESS it's the specific case where we want to switch to direct link.
         // Actually, the user said "ao cadastrar qualquer URL da Digistore24... adicione o sufixo".
         // But if I add suffix to a redir link, it might be lost during redirect.
         // However, the example given was a DIRECT URL.
         
         // Logic: If the URL does NOT have #aff=JohnPace, append it.
         if (!cleanUrl.includes('#aff=JohnPace')) {
             // Remove existing hash if any (unless it's part of the routing, but usually for tracking it's distinct)
             // But careful, some URLs use hash for routing.
             // Safe bet: Append &aff=JohnPace if ? exists, or #aff=JohnPace? 
             // Digistore convention is strictly #aff=AffiliateId
             
             // If there is already a hash, replace it or append? 
             // Usually it's the last part.
             if (cleanUrl.includes('#')) {
                 // Replace existing hash or append? 
                 // If it has #aff=SomeoneElse, replace it.
                 if (cleanUrl.includes('aff=')) {
                     cleanUrl = cleanUrl.replace(/aff=[^&]+/, 'aff=JohnPace');
                 } else {
                     // Existing hash is something else (e.g. #section), maybe we shouldn't touch it?
                     // Or maybe DS24 requires it to be the hash param.
                     // For now, let's assume we append it.
                     cleanUrl += '&aff=JohnPace'; // If hash exists, params often follow ? or &
                     // Actually DS24 docs say: url#aff=ID. 
                 }
             } else {
                 cleanUrl += '#aff=JohnPace';
             }
             
             console.log(`[Auto-Create] Applied Digistore Suffix Rule: ${cleanUrl}`);
             affiliate_url = cleanUrl;
         }
         
         // 2. If the user pasted a "redir" link with PRODUCT_ID placeholder, we MUST resolve or fix it.
         // But per user instruction, we are moving AWAY from redir links if possible.
         // If we can resolve the redirect to the final URL, we should use that + suffix.
    }

    // REMOVED: Old numeric ID injection logic (User requested removal)
    // if (affiliate_url && (affiliate_url.includes('PRODUCT_ID') ... )) { ... }

    if (affiliate_url && affiliate_url.includes('http')) {
        console.log(`[Auto-Create] Affiliate Link Detected. Using as Primary Source: ${affiliate_url}`);
        sourceUrl = affiliate_url;
        isAffiliateSource = true;
    }

    // 0.1 URL Resolution (Follow Redirects to get Final Destination)
    let finalScrapingUrl = sourceUrl;
    try {
        if (!isAffiliateSource) {
            // For raw URLs, try variations
            new URL(sourceUrl);
        }
        // Resolve URL to get the actual destination (Sales Page)
        // This effectively finds the "Official URL" from the Affiliate Link
        finalScrapingUrl = await resolveUrl(sourceUrl, name); 
        console.log(`[Auto-Create] Resolved Source URL to: ${finalScrapingUrl}`);
    } catch (e) {
        console.warn('[Auto-Create] URL Resolution failed, using original', e);
    }

    // 1. Scrape (With Fallback)
    console.log(`[Auto-Create] Scraping: ${finalScrapingUrl}`);
    let cleanText = '';
    let scrapedImage = '';

    try {
        const scrapeResult = await scrapeAndClean(finalScrapingUrl);
        cleanText = scrapeResult.text;
        scrapedImage = scrapeResult.image_url || '';
    } catch (e: any) {
        console.warn(`[Auto-Create] Scraping failed for ${finalScrapingUrl}:`, e.message);
        // Fallback: Proceed without official content, relying on Competitor Ads
        cleanText = `[Scraping Failed] Official content unavailable. Please analyze the Competitor Ads and Product Name "${name}" to infer the best copy and angle.`;
    }

    // 2. Prepare Negative Keywords
    // @ts-ignore
    const negatives = negativeKeywords[country.toLowerCase()] || negativeKeywords['en'];

    // 3. AI Generation
    const prompt = `
      You are a world-class Direct Response Copywriter and Conversion Rate Optimization (CRO) expert.
      
      TASK: Create a high-converting Pre-sell Page (Advertorial) for a product named "${name}".
      TARGET MARKET: ${country} (Language: ${country === 'DE' ? 'German' : country === 'FR' ? 'French' : country === 'BR' ? 'Portuguese' : 'English'}).
      
      INPUT CONTEXT:
      1. Official Page Content (Scraped from Affiliate Link Destination):
      ${cleanText.substring(0, 15000)}

      2. COMPETITOR ADS (Beat this copy!):
      ${competitorAds || 'None provided.'}

      REQUIREMENTS:
      1. **TONE & STYLE**: Direct Response Advertorial. Not just a "review", but a persuasive narrative that sells the "Dream" and agitates the "Pain".
      2. **MENTAL TRIGGERS (Must Use)**:
         - **Scarcity**: Mention "Low Stock" or "High Demand" in the copy.
         - **Urgency**: "Limited Time Offer" or "Discount Expires Soon".
         - **Social Proof**: Mention "Thousands of satisfied customers" or "Rated 4.9/5".
      3. **INGREDIENT ANALYSIS**:
         - Extract key ingredients from the text.
         - Explain HOW they solve the specific pain point (e.g., "Brown Adipose Tissue support").
      4. **STRONG CTA**:
         - DO NOT use boring buttons like "Check Availability".
         - USE: "Claim Factory Discount", "Check Stock Availability", "Rush My Order", "Secure My Bottle".
      5. **FAQ SECTION**:
         - Create 5 powerful FAQs that address the biggest objections (Legitimacy, Shipping, Refund Policy, Side Effects).

      OUTPUT JSON FORMAT (Strict):
      {
        "slug": "short-slug",
        "headline": "Main Headline (Correct Spelling)",
        "subheadline": "Subheadline (Persuasive & Clear)",
        "bullets": ["Benefit 1 (Trigger)", "Benefit 2 (Ingredient)", "Benefit 3 (Outcome)"],
        "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
        "unique_mechanism": "The Secret Mechanism",
        "whatIs": "Short description of what it is",
        "cta_text": "Strong CTA Phrase",
        "faq": [
            { "q": "Question 1?", "a": "Persuasive Answer 1" },
            { "q": "Question 2?", "a": "Persuasive Answer 2" }
        ],
        "seo_title": "SEO Title",
        "seo_description": "SEO Description",
        "vertical": "health", // AI must detect this based on content
        "google_ads": {
            "headlines": ["Ad H1", "Ad H2", "Ad H3", "Ad H4", "Ad H5", "Ad H6", "Ad H7", "Ad H8", "Ad H9", "Ad H10", "Ad H11", "Ad H12", "Ad H13", "Ad H14", "Ad H15"],
            "descriptions": ["Ad D1", "Ad D2", "Ad D3", "Ad D4"]
        }
      }

      IMPORTANT CONSTRAINTS (Google Ads Policy):
      - Headlines MUST be 30 characters or less.
      - Descriptions MUST be 90 characters or less.
      - Do not use exclamation marks in headlines.
      - Do not use "Click Here" or gimmicky capitalization.
    `;

    console.log('[Auto-Create] Generating Content...');
    const aiRaw = await generateContent(prompt);
    const jsonString = aiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

    // 4. Image Handling
    // Priority: Manual Upload > Scraped Image > Empty
    let finalImageUrl = manual_image_url || scrapedImage || '';
    
    // Safety: Handle Base64 Data URLs (Heavy) -> DISCARD (User request: URL strings only)
    if (finalImageUrl.startsWith('data:image')) {
         console.warn('[Auto-Create] Base64 image detected. Discarding to maintain performance (URL only policy).');
         finalImageUrl = ''; 
    } 
    // Handle Remote URLs -> KEEP AS IS (Do not download)
    else if (finalImageUrl.startsWith('http')) {
        // Just verify it's a valid URL string
        console.log(`[Auto-Create] Using remote image URL: ${finalImageUrl}`);
    } else {
        // Discard weird formats
        finalImageUrl = '';
    }

    // 4.5 Video Handling
    let finalVideoUrl = video_url || '';
    let youtubeId = '';
    
    if (finalVideoUrl) {
        // Try to extract YouTube ID
        const ytMatch = finalVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) {
            youtubeId = ytMatch[1];
            console.log(`[Auto-Create] Extracted YouTube ID: ${youtubeId}`);
        }
    }

    // 5. Construct Product Config
    // Check Catalog for tracking
    // @ts-ignore
    const catalogItem = Object.values(productCatalog.products).find((p: any) => p.name === name) as any;

    // Enforce Short Slug Logic in Code (Double Safety)
    let finalSlug = data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // Ensure slug is not empty
    if (!finalSlug || finalSlug === '-') finalSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Fallback Name if somehow empty
    const finalName = name || finalSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    if (finalSlug.split('-').length > 3) {
         // If slug is too long (> 3 words), truncate to first 2 words or just name
         const parts = finalSlug.split('-');
         finalSlug = parts.slice(0, 2).join('-');
         console.log(`[Auto-Create] Slug shortened: ${data.slug} -> ${finalSlug}`);
    }

    // Force Vertical from User Input (Priority) -> AI -> 'health' (safest default)
    let finalVertical = (userVertical || data.vertical || 'health').toLowerCase();
    
    // FALLBACK: Force 'health' if AI returns 'other' or 'general' to ensure valid subdomain
    if (finalVertical === 'other' || finalVertical === 'general') {
        // If user explicitly provided 'other', we might respect it, but generally for auto-create we want specific verticals.
        // If userVertical was provided, use it. If not, default to health.
        if (userVertical && userVertical !== 'other') {
             finalVertical = userVertical;
        } else {
             console.log(`[Auto-Create] Vertical '${finalVertical}' detected. Forcing 'health' for safety.`);
             finalVertical = 'health';
        }
    }

    // Map AI Vertical to Subdomain (Simple Logic)
    let finalSubdomain = finalVertical;
    if (finalVertical === 'supplements') finalSubdomain = 'health';
    if (finalVertical === 'tools' || finalVertical === 'home') finalSubdomain = 'diy';
    if (finalVertical === 'tech') finalSubdomain = 'gadgets';

    // RECOVERY: Title Safety
    let robustName = finalName;
    if (!robustName || robustName === 'Untitled Product' || robustName === 'New Product') {
         try {
            const u = new URL(finalScrapingUrl);
            const hostParts = u.hostname.split('.');
            // ex: getmitolyn.com -> mitolyn
            const extracted = hostParts.length > 2 ? hostParts[1] : hostParts[0];
            robustName = extracted.charAt(0).toUpperCase() + extracted.slice(1);
         } catch(e) {
            robustName = 'Product ' + Date.now();
         }
    }

    // STRICT CHECK: If still untitled, reject save to avoid pollution
    if (!robustName || robustName.includes('Untitled')) {
         return NextResponse.json({ error: 'Failed to extract valid product name. Please verify URL.' }, { status: 400 });
    }

    const newProduct: ProductConfig = {
        slug: finalSlug,
        name: robustName, // Use robust name
        vertical: finalSubdomain as any, // This is saved to KV
        subdomain: finalSubdomain, // Explicitly save subdomain for routing
        language: country.toLowerCase(),
        template: 'editorial',
        status: 'active', // FORCE ACTIVE
        platform: 'unknown',
        official_url: finalScrapingUrl, // Save the Resolved URL as official (clean)
        affiliate_url: (affiliate_url ? affiliate_url : (catalogItem ? `${catalogItem.base_url}/${catalogItem.id}/${catalogItem.vendor}` : finalScrapingUrl)).replace(/\{$/, ''), 
        image_url: finalImageUrl, // Prioritize scraped/uploaded image
        product_image_url: finalImageUrl, // ALIAS: Requested by user for explicit priority
        sales_page_image_url: sales_page_image_url || '', // NEW: Sales Page Preview
        video_url: finalVideoUrl, // New Video Field
        youtube_review_id: youtubeId, // Backward compatibility
        headline: data.headline,
        subheadline: data.subheadline,
        cta_text: data.cta_text || 'Check Availability',
        bullets: data.bullets,
        pain_points: data.pain_points, // Extended field
        unique_mechanism: data.unique_mechanism, // Extended field
        whatIs: { title: 'What Is It?', content: [data.whatIs] },
        faq: data.faq || [
            { q: "Is it legitimate?", a: "Yes, based on our research and user feedback." },
            { q: "How long for shipping?", a: "Typically 3-5 business days." }
        ],
        seo: {
            title: data.seo_title,
            description: data.seo_description
        },
        // Tracking
        google_ads_id: google_ads_id || catalogItem?.google_ads_id || '17850696537',
        google_ads_label: catalogItem?.google_ads_label,
        support_email: 'support@topproductofficial.com', // FORCE SUPPORT EMAIL
        
        // Ads
        ads: {
            status: 'ready',
            campaigns: [{
                campaignName: `${name} - Search - ${data.vertical.toUpperCase()}`,
                adGroups: [{
                    name: 'General Interest',
                    keywords: [`${name} reviews`, `buy ${name}`],
                    negativeKeywords: negatives,
                    ads: [{
                        headlines: data.google_ads.headlines,
                        descriptions: data.google_ads.descriptions,
                        finalUrl: finalScrapingUrl
                    }]
                }]
            }]
        }
    };

    // 6. Save
    const currentConfig = await getCampaignConfig();
    
    // Ensure products structure exists even if KV is empty
    if (!currentConfig.products) {
        currentConfig.products = {};
        console.log('[Auto-Create] Products object was missing. Created new.');
    }
    // CLEANUP: AGGRESSIVE SPACE SAVING (Fix "Edge Config Size Limit")
    if (Object.keys(currentConfig.products).length > 0) {
        const keepKeys = new Set<string>();
        
        // 1. Identify valid keys first
        Object.keys(currentConfig.products).forEach(key => {
            if (key !== 'undefined' && key !== 'null' && key.trim() !== '') {
                keepKeys.add(key);
            }
        });

        // 2. Filter and Optimize
        const optimizedProducts: Record<string, ProductConfig> = {};
        
        keepKeys.forEach(key => {
            const p = currentConfig.products[key];
            if (!p || !p.name) return; // Skip invalid

            // DUPLICATE REMOVAL: Mitolyn
            // If we have 'mitolyn' and this is 'mitolyn-1', 'mitolyn-copy', etc., skip it
            if (key.startsWith('mitolyn-') && keepKeys.has('mitolyn')) {
                console.log(`[Cleanup] Removing duplicate Mitolyn variant: ${key}`);
                return;
            }

            // HEAVY FIELD STRIPPING (Diet Mode)
            // Remove Ads config (heavy JSON) if it exists - user can regenerate if needed
            if (p.ads) delete p.ads; 
            
            // Remove Scraper/AI leftovers
            // @ts-ignore
            if (p.competitorAds) delete p.competitorAds;
            // @ts-ignore
            if (p.scrapeResult) delete p.scrapeResult;
            
            // Optimize Images (Base64 Nuke)
            if (p.image_url && p.image_url.startsWith('data:')) {
                 p.image_url = ''; 
            }
            if (p.image_url && p.image_url.length > 500) {
                 // If it's a huge URL but not base64, suspicious. Truncate or kill.
                 if (!p.image_url.startsWith('http')) p.image_url = '';
            }

            // Save optimized product
            optimizedProducts[key] = p;
        });

        // Replace with optimized list
        currentConfig.products = optimizedProducts;
    }
    
    // Force lowercase slug for consistency
    let safeSlug = (newProduct.slug || '').toLowerCase().trim();
    if (!safeSlug || safeSlug.length < 3) {
         safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!safeSlug) {
        safeSlug = `product-${Date.now()}`;
    }
    newProduct.slug = safeSlug;

    // SAVE DIRECTLY TO PRODUCTS KEY (Standard Format)
    // KEY CHANGE: Use "vertical:slug" as key to prevent collisions and enforce routing
    let storageKey = `${finalSubdomain}:${safeSlug}`;
    
    // ANTI-GHOSTING: Clean up any potential 'other:slug' or 'undefined:slug' ghosts
    const ghostKeys = [`other:${safeSlug}`, `undefined:${safeSlug}`, `${safeSlug}`];
    
    // SAFETY: Never save to 'other' if we have a valid vertical
    if (finalSubdomain === 'other' || finalSubdomain === 'undefined') {
        if (newProduct.vertical !== 'other' && newProduct.vertical !== 'general') {
             // If we ended up here but product says otherwise, correct it
             finalSubdomain = newProduct.vertical === 'supplements' ? 'health' : 
                              newProduct.vertical === 'tools' ? 'diy' : 'health';
             storageKey = `${finalSubdomain}:${safeSlug}`;
        } else {
             // If it truly is other, ensure we don't have a specific version
             // But actually, we want to BLOCK creation of 'other' if it's auto-pilot
             // unless explicitly allowed. For now, we force health as fallback above.
        }
    }

    ghostKeys.forEach(ghost => {
        if (currentConfig.products[ghost]) {
            console.log(`[Auto-Create] Removing ghost key: ${ghost}`);
            delete currentConfig.products[ghost];
        }
    });

    // GLOBAL UNIQUE CONSTRAINT: Check if slug exists in ANY vertical
    // If "health:mitolyn" exists, we CANNOT create "diy:mitolyn"
    const existingKey = Object.keys(currentConfig.products).find(k => k.endsWith(`:${safeSlug}`) || k === safeSlug);
    if (existingKey && existingKey !== storageKey) {
        console.log(`[Auto-Create] Slug '${safeSlug}' already exists in '${existingKey}'. Aborting duplicate creation.`);
        // Return success with existing slug to redirect user, but DO NOT save new one
        return NextResponse.json({ 
            success: true, 
            slug: safeSlug,
            vertical: currentConfig.products[existingKey].vertical,
            message: 'Product already exists. Redirecting...'
        });
    }

    // VALIDATION: Unique Slug Check (Collision within same vertical)
    let counter = 2;
    // Check if key exists (simplified check, ideally we read from KV first but we have currentConfig)
    while (currentConfig.products[storageKey] || currentConfig.products[safeSlug]) {
        console.log(`[Auto-Create] Collision detected for ${storageKey}. Appending suffix...`);
        safeSlug = `${newProduct.slug}-${counter}`;
        storageKey = `${finalSubdomain}:${safeSlug}`;
        counter++;
    }
    newProduct.slug = safeSlug; // Update product slug

    currentConfig.products[storageKey] = newProduct;
    
    // Debug log
    console.log(`[CREATE-DEBUG] Tentando gravar chave: ${storageKey} no banco (Products Object Count: ${Object.keys(currentConfig.products).length})`, { 
        hasName: !!newProduct.name,
        hasUrl: !!newProduct.official_url,
        hasAds: !!newProduct.ads 
    });
    
    // Add Timestamp to Force Cache Bypass
    // @ts-ignore
    currentConfig.lastUpdated = Date.now();

    const saveResult = await updateCampaignConfig(currentConfig);

    if (!saveResult.success) {
        throw new Error(`DB Save Failed: ${saveResult.error}`);
    }
    
    console.log(`[Auto-Create] PRODUTO SALVO COM SUCESSO NA CHAVE: ${storageKey}`);

    // 7. Auto-Save Assets to Library (Silent)
    try {
        if (newProduct.product_image_url) {
            await addAsset({
                productId: safeSlug,
                productName: newProduct.name,
                type: 'image',
                url: newProduct.product_image_url,
                label: `Auto-Saved Image (${new Date().toLocaleDateString()})`,
                notes: 'Saved via Auto-Pilot Generation'
            });
            console.log(`[Asset] Image auto-saved for ${safeSlug}`);
        }

        if (newProduct.sales_page_image_url) {
            await addAsset({
                productId: safeSlug,
                productName: newProduct.name,
                type: 'image',
                url: newProduct.sales_page_image_url,
                label: `Sales Page Preview (${new Date().toLocaleDateString()})`,
                notes: 'Saved via Auto-Pilot Generation'
            });
        }

        if (newProduct.video_url) {
            await addAsset({
                productId: safeSlug,
                productName: newProduct.name,
                type: 'video',
                url: newProduct.video_url,
                label: `Auto-Saved Video (${new Date().toLocaleDateString()})`,
                notes: 'Saved via Auto-Pilot Generation'
            });
            console.log(`[Asset] Video auto-saved for ${safeSlug}`);
        }
    } catch (e) {
        console.warn('Failed to auto-save assets:', e);
    }

    return NextResponse.json({ 
        success: true, 
        slug: safeSlug,
        vertical: newProduct.vertical // Return vertical for frontend routing
    });
}
// Removed the old catch block here since it is now inside POST wrapper