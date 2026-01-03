import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, getProductBySlug } from '@/lib/campaignConfig';
import { getVerticalFromHost } from '@/lib/host';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Helper to preserve query params from request
function preserveQueryParams(targetUrl: string, requestUrl: string): string {
  try {
    const target = new URL(targetUrl);
    const request = new URL(requestUrl);
    
    // Append all search params from request to target
    request.searchParams.forEach((value, key) => {
      // Don't overwrite if already present (unless necessary, but usually appending is safer)
      if (!target.searchParams.has(key)) {
        target.searchParams.set(key, value);
      }
    });
    
    return target.toString();
  } catch {
    return targetUrl;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.redirect(new URL('/offline', request.url));
    }

    const config = await getCampaignConfig();
    const product = getProductBySlug(config, slug);

    if (!product || product.status !== 'active') {
       console.error(`[Redirect] Product not found or inactive: ${slug}`);
       return NextResponse.redirect(new URL('/offline', request.url));
    }

    // Vertical Check
    const host = request.headers.get('host');
    const detectedVertical = getVerticalFromHost(host);
    
    if (detectedVertical && product.vertical !== detectedVertical) {
        console.warn(`[Redirect] Vertical Mismatch: Host=${detectedVertical}, Product=${product.vertical}`);
        return NextResponse.redirect(new URL('/offline', request.url));
    }

    // Determine target URL: affiliate > official
    let targetUrl = product.affiliate_url || product.official_url;
    
    if (!targetUrl) {
      return NextResponse.redirect(new URL('/offline', request.url));
    }

    // Preserve UTMs and other tracking params
    targetUrl = preserveQueryParams(targetUrl, request.url);

    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error(`[Redirect] Critical Error for slug ${request.url}:`, error);
    return NextResponse.redirect(new URL('/offline', request.url));
  }
}
