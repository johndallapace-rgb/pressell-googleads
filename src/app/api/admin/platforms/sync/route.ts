import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { scrapeAndClean } from '@/lib/scraper';
import { generateContent } from '@/lib/gemini';
import { getSystemConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { platform, marketplaceUrl } = await request.json();

    if (!marketplaceUrl) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const config = await getSystemConfig();
    const nickname = config.affiliate_nickname || 'johnpace';
    const digistoreId = config.platforms?.digistore?.credentials?.affiliate_id || nickname;

    // 1. Scrape the marketplace feed
    // Note: In a real scenario, this would need specialized logic for each platform's DOM.
    // We use the generic scraper here as a "best effort" to capture visible text.
    const content = await scrapeAndClean(marketplaceUrl);

    // 2. Analyze with Gemini to extract Gravity/Rank/Trends with STRICT FILTERS
    const prompt = `
        Analyze the following text scraped from a ${platform} marketplace feed.
        
        STRICT FILTERS FOR "BEST CHOICE" (GLOBAL SCALE):
        1. Gravity/Popularity Score: Must be > 80 (if detected).
        2. Avg $/Sale: Prioritize offers above $100 (or equivalent in EUR/GBP).
        3. Geography: Identify if product is trending in US, UK, DE, or FR.
        
        4. Vertical Mapping & Language: 
           - If Health/Fitness -> Suggest "health.topproductofficial.com"
           - If Woodworking/Home -> Suggest "diy.topproductofficial.com"
           - If Dating/Relationships -> Suggest "dating.topproductofficial.com"
           
           - **Multilingual Support**: If the product targets non-US markets (e.g., Germany), suggest the appropriate language code (de, fr, es) for the pre-sell.

        AI INSIGHT RULE:
        - Write ONE concise sentence explaining why this product wins based on the filters (e.g., "Top seller in Germany with €120 avg payout, suggested DE language.").

        CRITICAL: OFFICIAL URL & VENDOR ID MINING
        - You MUST identify the DIRECT sales page URL (VSL) from the text.
        - You MUST extract the VENDOR ID / PRODUCT ID (e.g., from 'mitolyn' in a URL like mitolyn.com or hop links).
        - If Vendor ID is not explicit, infer it from the product name (lowercase, no spaces).
        - NEVER use "VENDOR_ID" as a placeholder.
        
        - **AFFILIATE LINK CONSTRUCTION RULES**:
          1. If platform is **BuyGoods**: https://www.buygoods.com/affiliate?affiliate=${nickname}&product=[PRODUCT_ID]
          2. If platform is **MaxWeb**: https://maxweb.com/redir?affiliate=${nickname}&offer=[OFFER_ID]
          3. If platform is **ClickBank**: https://hop.clickbank.net/?affiliate=${nickname}&vendor=[VENDOR_ID]
          4. If platform is **Digistore24**: https://www.digistore24.com/redir/[INSERT_NUMERIC_ID_HERE]/${digistoreId}
             - CRITICAL: Replace [INSERT_NUMERIC_ID_HERE] with the ACTUAL numeric product ID (e.g. 385456). Do not use the string "PRODUCT_ID".
          
        - Construct the "affiliate_url" using the rule above that matches the platform detected or the URL structure found.

        Return a JSON object with a list of "products":
        {
            "products": [
                {
                    "name": "Product Name",
                    "vertical": "Health",
                    "platform": "Digistore24", // or BuyGoods, MaxWeb, ClickBank
                    "suggested_subdomain": "health.topproductofficial.com",
                    "suggested_language": "en", // or de, fr, es
                    "gravity": 123,
                    "avg_payout": 150,
                    "currency": "USD", // or EUR, GBP
                    "rank": 1,
                    "ai_insight": "Reason why it is a winner...",
                    "official_url": "https://offer-url.com/video", // MUST be the official VSL
                    "vendor_id": "385456", // Extracted ID (Numeric for Digistore)
                    "affiliate_url": "https://www.digistore24.com/redir/385456/${digistoreId}" // Fully constructed link with ID
                }
            ]
        }

        Limit to top 5 products that pass the filters.

        CONTENT:
        ${String((content as any)?.text || content || '').substring(0, 30000)}
    `;

    const aiResponse = await generateContent(prompt);
    
    // Parse and Sanitize
    let parsed: any;
    try {
        const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(jsonStr);
        
        // Post-Processing: Fix broken affiliate URLs
        if (parsed.products && Array.isArray(parsed.products)) {
            parsed.products.forEach((p: any) => {
                if (p.affiliate_url && (p.affiliate_url.includes('[PRODUCT_ID]') || p.affiliate_url.includes('PRODUCT_ID'))) {
                    console.warn(`[Platform Sync] Found broken PRODUCT_ID in URL for ${p.name}. Attempting fix...`);
                    if (p.vendor_id && /^\d+$/.test(p.vendor_id)) {
                        // If vendor_id is numeric (Digistore style), use it
                        p.affiliate_url = p.affiliate_url.replace(/\[?PRODUCT_ID\]?/g, p.vendor_id);
                        console.log(`[Platform Sync] Fixed URL: ${p.affiliate_url}`);
                    } else {
                         // If we can't fix it, nullify it to prevent bad links
                         // Or fallback to official URL if available? No, we need affiliate link.
                         console.warn(`[Platform Sync] Could not fix URL for ${p.name}. Marking for manual review.`);
                         p.ai_insight += " (⚠️ CHECK AFFILIATE LINK)";
                    }
                }
            });
        }
    } catch (e) {
        console.error('JSON Parse Error during sync:', e);
    }

    // In a real app, we would save this to a DB. 
    // Here we just log it to show the "Action" occurred.
    console.log(`[Platform Sync] ${platform} synced. AI extracted:`, parsed || aiResponse);

    return NextResponse.json({ success: true, ai_analysis: parsed || aiResponse });

  } catch (error: any) {
    console.error('Platform Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
