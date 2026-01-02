import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

interface ImportResult {
  name?: string;
  image_url?: string;
  headline_suggestions: string[];
  subheadline_suggestions: string[];
  bullets_suggestions: string[];
  seo: {
    title: string;
    description: string;
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
    
    // Safety check: Don't process massive files
    if (html.length > 5 * 1024 * 1024) { // 5MB limit
         return NextResponse.json({ error: 'Page too large to process' }, { status: 400 });
    }

    // Heuristic Extraction using Regex
    const result: ImportResult = {
      headline_suggestions: [],
      subheadline_suggestions: [],
      bullets_suggestions: [],
      seo: { title: '', description: '' }
    };

    // 1. Title & SEO
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
        result.seo.title = titleMatch[1].trim();
        result.name = result.seo.title.split(/[-|]/)[0].trim(); // Guess name from title
    }

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) {
        result.seo.description = descMatch[1].trim();
    }

    // 2. Image (OG Image or first large img)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogImageMatch) {
        result.image_url = ogImageMatch[1];
    }

    // 3. Headings (H1, H2)
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
    if (h1Match) {
        h1Match.slice(0, 3).forEach(h => {
            const text = h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (text.length > 10) result.headline_suggestions.push(text);
        });
    }

    const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
    if (h2Match) {
        h2Match.slice(0, 5).forEach(h => {
            const text = h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (text.length > 10) result.subheadline_suggestions.push(text);
        });
    }

    // 4. Bullets (LI items that look like features)
    const liMatch = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (liMatch) {
        const potentialBullets = liMatch
            .map(li => li.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
            .filter(text => text.length > 20 && text.length < 150) // Filter short/long items
            .slice(0, 10); // Take top 10 candidates
        
        result.bullets_suggestions = [...new Set(potentialBullets)].slice(0, 5); // Dedup and take 5
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
