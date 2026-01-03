import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

interface ImportResult {
  name?: string;
  image_url?: string;
  headline_suggestions: string[];
  subheadline_suggestions: string[];
  bullets_suggestions: string[];
  pain_points?: string[];
  unique_mechanism?: string;
  seo: {
    title: string;
    description: string;
  };
  vertical?: string;
  google_ads?: {
    headlines: string[];
    descriptions: string[];
  };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { official_url } = await request.json();

    if (!official_url || !official_url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const res = await fetch(official_url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();
    
    // Safety check
    if (html.length > 5 * 1024 * 1024) { 
         return NextResponse.json({ error: 'Page too large to process' }, { status: 400 });
    }

    // Clean HTML for AI (Remove scripts, styles, svgs to save tokens)
    const cleanText = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gim, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 100000); // Limit to ~100k chars for speed

    // Extract Image separately (Regex is faster/reliable for OG tags)
    let imageUrl = '';
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogImageMatch) imageUrl = ogImageMatch[1];

    // AI Analysis
    const prompt = `
      You are a Direct Response Copywriter. Analyze the following HTML/Text from a sales page.
      
      EXTRACT THE FOLLOWING:
      1. Product Name
      2. Main Headline (The big promise)
      3. Subheadline (The hook/support)
      4. 5 Key Benefits (Bullets)
      5. 3 Major Pain Points the product solves
      6. The "Unique Mechanism" (How it works/Secret ingredient)
      7. SEO Title & Description
      8. Determine Vertical (Choose one: health, diy, pets, dating, finance, other)
      9. Write 3 Google Ads Headlines (Max 30 chars each, persuasive, relevant)
      10. Write 2 Google Ads Descriptions (Max 90 chars each)

      Return ONLY valid JSON:
      {
        "name": "Product Name",
        "vertical": "health",
        "headline_suggestions": ["Headline 1"],
        "subheadline_suggestions": ["Subhead 1"],
        "bullets_suggestions": ["Benefit 1", ...],
        "pain_points": ["Pain 1", ...],
        "unique_mechanism": "Description...",
        "seo": { "title": "...", "description": "..." },
        "google_ads": {
            "headlines": ["Ad Headline 1", "Ad Headline 2", "Ad Headline 3"],
            "descriptions": ["Ad Description 1", "Ad Description 2"]
        }
      }

      CONTENT:
      ${cleanText}
    `;

    const aiResponse = await generateContent(prompt);
    const jsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse AI response', jsonString);
        throw new Error('AI analysis failed');
    }

    const result: ImportResult = {
        ...data,
        image_url: imageUrl || data.image_url // Prefer OG tag, fallback to AI
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
