import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig, saveProduct, ProductConfig, updateCampaignConfig, getSystemConfig } from '@/lib/config';
import { generateContent } from '@/lib/gemini';
import { scrapeAndClean } from '@/lib/scraper';

export const runtime = 'nodejs';

// Helper to translate/adapt content
async function adaptContent(baseText: string, targetLang: string, product: ProductConfig, template: string) {
    const prompt = `
    ROLE: World-class Direct Response Copywriter & Translator.
    TASK: Adapt the following product info for the ${targetLang.toUpperCase()} market using the "${template.toUpperCase()}" format.
    
    PRODUCT: ${product.name}
    VERTICAL: ${product.vertical}
    TEMPLATE STRATEGY:
    - If COOKIE: Use strict, short, compliance-focused micro-copy. "Confirm your age", "Review benefits".
    - If EDITORIAL: Use direct benefits, "As seen in", bold claims. Bridge page style.
    - If STORY (Advertorial): Start with a hook/story. "How I cured X". Emotional engagement. 
      * FOR SPANISH (ES): Use "Health Authority" tone. Keywords: "Salud Profunda", "Método Natural", "Científicamente Probado".
      * START WITH: "Descubra por qué los expertos están cambiando su rutina..."
    
    INSTRUCTIONS:
    1. Translate to ${targetLang} (Native Level).
    2. ADAPT cultural references (e.g., if German, focus on precision/science/biohacking; if French, focus on beauty/vitality).
    3. Keep the sales psychology intact (Pain/Agitation/Solution).
    4. Focus on COMPLIANCE: Ensure claims are safe for EU markets.
    
    OUTPUT JSON:
    {
        "headline": "Translated Headline (High Converting)",
        "subheadline": "Translated Subheadline",
        "cta_text": "Translated CTA (Action Oriented)",
        "bullets": ["Benefit 1", "Benefit 2", "Benefit 3"],
        "faq": [
            {"q": "Q1", "a": "A1"},
            {"q": "Q2", "a": "A2"}
        ],
        "whatIs": { "title": "Title", "content": ["P1", "P2"] },
        "seo": { "title": "SEO Title", "description": "SEO Desc" }
    }

    BASE CONTENT TO ADAPT:
    Headline: ${product.headline}
    Subheadline: ${product.subheadline}
    Bullets: ${(product.bullets || []).join(' | ')}
    Full Text Context: ${baseText.substring(0, 5000)}
    `;

    const raw = await generateContent(prompt);
    try {
        const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error(`Failed to parse adaptation for ${targetLang}`, raw);
        return null;
    }
}

// 4 Pillars of Global Conversion
const TEMPLATE_MAPPING: Record<string, 'cookie' | 'editorial' | 'story'> = {
    'de': 'cookie',
    'fr': 'cookie',
    'uk': 'editorial',
    'us': 'editorial',
    'br': 'story',
    'es': 'story', // Changed from cookie to story
    'pt': 'story'
};

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  // Auth Check
  if (!token && request.headers.get('Authorization') !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    if (token && !(await verifyToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { slug, productName, vertical } = await request.json();

    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

    const config = await getCampaignConfig();
    
    // Find base product (check all keys)
    let baseKey = Object.keys(config.products).find(k => k.endsWith(`:${slug}`) || k === slug);
    if (!baseKey) return NextResponse.json({ error: 'Base product not found' }, { status: 404 });
    
    const baseProduct = config.products[baseKey];

    // 1. Analyze Top Markets (Mock Logic + AI Confirmation)
    // Real logic would check trends, but we simulate Gemini's decision
    const topMarkets = [
        { code: 'de', name: 'Germany', culture: 'Efficiency & Science' },
        { code: 'fr', name: 'France', culture: 'Beauty & Lifestyle' },
        { code: 'es', name: 'Spain', culture: 'Value & Health' }
    ];

    // Scrape original content for context
    let baseContext = '';
    try {
        const scrape = await scrapeAndClean(baseProduct.official_url);
        baseContext = scrape.text;
    } catch (e) {
        baseContext = `Product: ${productName}. Vertical: ${vertical}.`;
    }

    const createdProducts: string[] = [];

        // 2. Generate Variations
    await Promise.all(topMarkets.map(async (market) => {
        console.log(`[Scale] Adapting for ${market.name}...`);
        
        // Determine Template Strategy
        const templateStrategy = TEMPLATE_MAPPING[market.code] || 'cookie';

        // FORCE DEEP ANALYSIS: Use scraped content if available, otherwise fail gracefully or use brief
        const contentToAnalyze = baseContext.length > 200 ? baseContext : `Product: ${productName}. Vertical: ${vertical}.`;

        const adapted = await adaptContent(contentToAnalyze, market.code, baseProduct, templateStrategy);
        if (!adapted) return;

        const newSlug = `${slug}-${market.code}`; // e.g. prodentim-de
        const storageKey = `${vertical}:${newSlug}`; // health:prodentim-de

        // AUTOMATED HOPLINK REPLICATION (Tracking Persistence)
        // Instead of guessing the vendor ID, we REUSE the base product's affiliate link
        // but append tracking parameters for the new market.
        let autoAffiliateLink = baseProduct.affiliate_url;
        
        // Ensure we have a valid link for background rendering too
        if (!autoAffiliateLink) {
             const cleanSlug = slug.replace(/^(?:health:|beauty:|bizopp:)/, '');
             const vendorId = cleanSlug.replace(/-review|-bonus|-official/g, '').replace(/-/g, '');
             autoAffiliateLink = `https://hop.clickbank.net/?affiliate=johnpace&vendor=${vendorId}`;
        }

        let trackingLink = autoAffiliateLink;
        if (trackingLink) {
             // Append or update tracking ID
             const separator = trackingLink.includes('?') ? '&' : '?';
             
             // Check if it's ClickBank
             if (trackingLink.includes('clickbank.net')) {
                 // Add tid=scale_MARKET (e.g. tid=scale_de)
                 if (!trackingLink.includes('tid=')) {
                     trackingLink += `${separator}tid=scale_${market.code}`;
                 } else {
                     trackingLink = trackingLink.replace(/tid=[^&]+/, `tid=scale_${market.code}`);
                 }
             } 
             // Digistore/Other generic append
             else {
                 if (!trackingLink.includes('track=')) {
                     trackingLink += `${separator}track=scale_${market.code}`;
                 }
             }
        }

        // IMAGE & VIDEO REPLICATION (Asset Mapping)
        // Ensure assets are carried over to the translated version
        let finalImage = baseProduct.image_url || baseProduct.product_image_url || '';
        let finalVideo = baseProduct.video_url || '';

        const newProduct: ProductConfig = {
            ...baseProduct,
            slug: newSlug,
            name: `${baseProduct.name} (${market.name})`,
            language: market.code,
            template: templateStrategy as any, // Apply Strategy
            status: 'active',
            headline: adapted.headline,
            subheadline: adapted.subheadline,
            cta_text: adapted.cta_text, // "Visit Official Website" translated
            bullets: adapted.bullets,
            faq: adapted.faq,
            whatIs: adapted.whatIs,
            seo: adapted.seo,
            // FORCE AFFILIATE LINK IN ALL BUTTONS
            affiliate_url: trackingLink, // OVERRIDE: Persisted Tracking
            official_url: baseProduct.official_url || trackingLink, // Use tracking link as official if missing (for iframe bg)
            image_url: finalImage,
            product_image_url: finalImage,
            video_url: finalVideo // Replicate Video
        };

        // Save Individual Product (Side A) - DUAL WRITE
        // This helper now handles both keys (vertical:slug + slug)
        // Ensure we pass the full object.
        console.log(`[Scale] Saving canonical keys for: ${newSlug}`);
        await saveProduct(newProduct);
        
        // Add to Index (Side B)
        config.products[storageKey] = newProduct;
        createdProducts.push(newSlug);
    }));

    // Save Index
    await updateCampaignConfig(config);

    return NextResponse.json({ 
        success: true, 
        createdProducts,
        message: 'Global scaling complete. Cookie templates applied.'
    });

  } catch (error: any) {
    console.error('Scale Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
