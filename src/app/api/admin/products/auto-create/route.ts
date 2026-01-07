import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';
import { scrapeAndClean } from '@/lib/scraper';
import { getCampaignConfig, ProductConfig, updateCampaignConfig } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import negativeKeywords from '@/data/negative-keywords.json';
import productCatalog from '@/data/product-catalog.json';

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

    const { importUrl, name, competitorAds, country, vertical } = await request.json();

    if (!importUrl || !name) {
        // Fallback: If name is missing, try to extract from importUrl again (Double Safety)
        if (importUrl && !name) {
            try {
                const u = new URL(importUrl);
                const hostParts = u.hostname.split('.');
                const extractedName = hostParts.length > 2 ? hostParts[1] : hostParts[0];
                console.log(`[Auto-Create] Name missing, auto-extracted: ${extractedName}`);
                // Proceed with extracted name
                return await handleCreation(request, importUrl, extractedName, competitorAds, country, vertical); 
            } catch(e) {}
        }
        return NextResponse.json({ error: 'Missing importUrl or name' }, { status: 400 });
    }
    
    return await handleCreation(request, importUrl, name, competitorAds, country, vertical);
  } catch (error: any) {
    console.error('[Auto-Create] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCreation(request: NextRequest, importUrl: string, name: string, competitorAds: string, country: string, userVertical?: string) {
    // 0. URL Validation
    try {
        new URL(importUrl);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // 1. Scrape (With Fallback)
    console.log(`[Auto-Create] Scraping: ${importUrl}`);
    let cleanText = '';
    let scrapedImage = '';

    try {
        const scrapeResult = await scrapeAndClean(importUrl);
        cleanText = scrapeResult.text;
        scrapedImage = scrapeResult.image_url;
    } catch (e: any) {
        console.warn(`[Auto-Create] Scraping failed for ${importUrl}:`, e.message);
        // Fallback: Proceed without official content, relying on Competitor Ads
        cleanText = `[Scraping Failed] Official content unavailable. Please analyze the Competitor Ads and Product Name "${name}" to infer the best copy and angle.`;
    }

    // 2. Prepare Negative Keywords
    // @ts-ignore
    const negatives = negativeKeywords[country.toLowerCase()] || negativeKeywords['en'];

    // 3. AI Generation
    const prompt = `
      You are a world-class Direct Response Copywriter.
      
      TASK: Create a high-converting Pre-sell Page configuration for a product named "${name}".
      TARGET MARKET: ${country} (Language: ${country === 'DE' ? 'German' : country === 'FR' ? 'French' : country === 'BR' ? 'Portuguese' : 'English'}).
      
      INPUT CONTEXT:
      1. Official Page Content:
      ${cleanText.substring(0, 15000)}

      2. COMPETITOR ADS (Beat this copy!):
      ${competitorAds || 'None provided.'}

      REQUIREMENTS:
      - Analyze the input to find the "Unique Mechanism" and "Pain Points".
      - Write in the NATIVE language of the target market.
      - Create a "Shadow Persona" for the review (impartial but persuasive).
      - If Competitor Ads are provided, write headlines that are clearly superior (more specific, higher curiosity).
      - **CRITICAL**: Perform a strict SPELL-CHECK on all output. 
        - Fix common typos like "Finaly" -> "Finally", "Supercharing" -> "Supercharging".
        - Ensure perfect grammar and capitalization in the Headline.
        - Do not use all-caps for the entire headline.
      - **SLUG OPTIMIZATION**: Generate a SHORT, clean slug (max 2-3 words).
        - BAD: "mitolyn-metabolism-support-review-2024"
        - GOOD: "mitolyn", "mitolyn-review", "mitolyn-official"
      - **VERTICAL CLASSIFICATION**: Analyze the product and assign a vertical.
        - "health": Supplements, Weight Loss, Skin, Dental, Hearing, Joint Pain.
        - "diy": Home Improvement, Tools, Energy Savers, Cleaning Gadgets.
        - "gadgets": Tech, Drones, Heaters, Coolers, Smart Devices.
        - "finance": Crypto, Investing, Biz Opp.
        - "dating": Dating Guides, Pheromones.
        - "pets": Dog Training, Pet Health.
        - "other": Anything else.

      OUTPUT JSON FORMAT (Strict):
      {
        "slug": "short-slug",
        "headline": "Main Headline (Correct Spelling)",
        "subheadline": "Subheadline (Persuasive & Clear)",
        "bullets": ["Benefit 1", "Benefit 2", "Benefit 3"],
        "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
        "unique_mechanism": "The Secret Mechanism",
        "whatIs": "Short description of what it is",
        "seo_title": "SEO Title",
        "seo_description": "SEO Description",
        "vertical": "health", // AI must detect this based on content
        "google_ads": {
            "headlines": ["Ad H1", "Ad H2", "Ad H3"],
            "descriptions": ["Ad D1", "Ad D2"]
        }
      }
    `;

    console.log('[Auto-Create] Generating Content...');
    const aiRaw = await generateContent(prompt);
    const jsonString = aiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

    // 4. Image Handling
    let finalImageUrl = scrapedImage || '';
    
    // Safety: Handle Base64 Data URLs (Heavy)
    if (finalImageUrl.startsWith('data:image')) {
        try {
             console.log('[Auto-Create] Converting Base64 Image to File...');
             const matches = finalImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
             if (matches && matches.length === 3) {
                const ext = matches[1].split('/')[1].replace('jpeg', 'jpg') || 'jpg';
                const buffer = Buffer.from(matches[2], 'base64');
                const fileName = `${data.slug}-${Date.now()}.${ext}`;
                const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
                fs.writeFileSync(path.join(publicDir, fileName), buffer);
                finalImageUrl = `/images/products/${fileName}`;
             } else {
                 console.warn('[Auto-Create] Invalid Base64, discarding.');
                 finalImageUrl = ''; 
             }
        } catch (e) {
            console.error('[Auto-Create] Failed to save base64 image', e);
            finalImageUrl = '';
        }
    } 
    // Handle Remote URLs
    else if (finalImageUrl.startsWith('http')) {
        try {
            console.log(`[Auto-Create] Downloading image: ${finalImageUrl}`);
            const res = await fetch(finalImageUrl);
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                let ext = '.jpg';
                if (contentType?.includes('png')) ext = '.png';
                if (contentType?.includes('webp')) ext = '.webp';
                
                const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
                
                const fileName = `${data.slug}-${Date.now()}${ext}`;
                const filePath = path.join(publicDir, fileName);
                
                if (res.body) {
                    // @ts-ignore
                    await streamPipeline(res.body, fs.createWriteStream(filePath));
                    finalImageUrl = `/images/products/${fileName}`;
                }
            }
        } catch (e) {
            console.error('Image download failed', e);
        }
    } else {
        // Discard weird formats
        finalImageUrl = '';
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
    const finalName = name || finalSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
            const u = new URL(importUrl);
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
        official_url: importUrl,
        affiliate_url: catalogItem ? `${catalogItem.base_url}/${catalogItem.id}/${catalogItem.vendor}` : importUrl, // Fallback if no catalog match
        image_url: finalImageUrl, // Prioritize scraped/uploaded image
        headline: data.headline,
        subheadline: data.subheadline,
        cta_text: 'Check Availability',
        bullets: data.bullets,
        pain_points: data.pain_points, // Extended field
        unique_mechanism: data.unique_mechanism, // Extended field
        whatIs: { title: 'What Is It?', content: [data.whatIs] },
        faq: [
            { q: "Is it legitimate?", a: "Yes, based on our research and user feedback." },
            { q: "How long for shipping?", a: "Typically 3-5 business days." }
        ],
        seo: {
            title: data.seo_title,
            description: data.seo_description
        },
        // Tracking
        google_ads_id: catalogItem?.google_ads_id || '17850696537',
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
                        finalUrl: importUrl
                    }]
                }]
            }]
        }
    };

    // 6. Save
    const currentConfig = await getCampaignConfig();
    
    // CLEANUP: AGGRESSIVE SPACE SAVING (Fix "Edge Config Size Limit")
    if (currentConfig.products) {
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
    
    // Ensure products structure
    if (!currentConfig.products) currentConfig.products = {};
    
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
    console.log(`[Auto-Create] Saving product: ${storageKey}`, { 
        hasName: !!newProduct.name,
        hasUrl: !!newProduct.official_url,
        hasAds: !!newProduct.ads 
    });
    
    const saveResult = await updateCampaignConfig(currentConfig);

    if (!saveResult.success) {
        throw new Error(`DB Save Failed: ${saveResult.error}`);
    }
    
    console.log(`[Auto-Create] PRODUTO SALVO COM SUCESSO NA CHAVE: ${storageKey}`);

    return NextResponse.json({ 
        success: true, 
        slug: safeSlug,
        vertical: newProduct.vertical // Return vertical for frontend routing
    });
}
// Removed the old catch block here since it is now inside POST wrapper