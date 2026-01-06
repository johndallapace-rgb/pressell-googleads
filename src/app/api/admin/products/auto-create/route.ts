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

    const { importUrl, name, competitorAds, country } = await request.json();

    if (!importUrl || !name) {
        return NextResponse.json({ error: 'Missing importUrl or name' }, { status: 400 });
    }

    // 1. Scrape
    console.log(`[Auto-Create] Scraping: ${importUrl}`);
    const { text: cleanText, image_url: scrapedImage } = await scrapeAndClean(importUrl);

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

      OUTPUT JSON FORMAT (Strict):
      {
        "slug": "kebab-case-slug",
        "headline": "Main Headline",
        "subheadline": "Subheadline",
        "bullets": ["Benefit 1", "Benefit 2", "Benefit 3"],
        "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
        "unique_mechanism": "The Secret Mechanism",
        "whatIs": "Short description of what it is",
        "seo_title": "SEO Title",
        "seo_description": "SEO Description",
        "vertical": "health", // or diy, pets, dating, finance
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
    if (finalImageUrl.startsWith('http')) {
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
    }

    // 5. Construct Product Config
    // Check Catalog for tracking
    // @ts-ignore
    const catalogItem = Object.values(productCatalog.products).find((p: any) => p.name === name) as any;

    const newProduct: ProductConfig = {
        slug: data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: name,
        vertical: (data.vertical || 'health') as any,
        language: country.toLowerCase(),
        template: 'editorial',
        status: 'active',
        platform: 'unknown',
        official_url: importUrl,
        affiliate_url: catalogItem ? `${catalogItem.base_url}/${catalogItem.id}/${catalogItem.vendor}` : importUrl, // Fallback if no catalog match
        image_url: finalImageUrl,
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
        support_email: 'support@topproductofficial.com',
        
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
    if (!currentConfig.products) currentConfig.products = {};
    currentConfig.products[newProduct.slug] = newProduct;
    
    await updateCampaignConfig(currentConfig);

    return NextResponse.json({ success: true, slug: newProduct.slug });

  } catch (error: any) {
    console.error('[Auto-Create] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}