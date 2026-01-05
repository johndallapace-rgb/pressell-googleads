import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { scrapeAndClean } from '@/lib/scraper';
import { generateContent } from '@/lib/gemini';

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

        Return a JSON object with a list of "products":
        {
            "products": [
                {
                    "name": "Product Name",
                    "vertical": "Health",
                    "suggested_subdomain": "health.topproductofficial.com",
                    "suggested_language": "en", // or de, fr, es
                    "gravity": 123,
                    "avg_payout": 150,
                    "currency": "USD", // or EUR, GBP
                    "rank": 1,
                    "ai_insight": "Reason why it is a winner...",
                    "url": "Original URL or placeholder"
                }
            ]
        }

        Limit to top 5 products that pass the filters.

        CONTENT:
        ${content.substring(0, 30000)}
    `;

    const aiResponse = await generateContent(prompt);
    
    // In a real app, we would save this to a DB. 
    // Here we just log it to show the "Action" occurred.
    console.log(`[Platform Sync] ${platform} synced. AI extracted:`, aiResponse);

    return NextResponse.json({ success: true, ai_analysis: aiResponse });

  } catch (error: any) {
    console.error('Platform Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
