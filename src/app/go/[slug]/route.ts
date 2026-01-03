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
      return new Response(null, { status: 404 });
    }

    const config = await getCampaignConfig();
    const product = config.products?.[slug]; // Safe access

    if (!product || product.status !== 'active') {
       console.error(`[Redirect] Product not found or inactive: ${slug}`);
       return new Response(null, { status: 404 });
    }
    
    // Validate affiliate URL
    if (!product.affiliate_url) {
        console.error(`[Redirect] Missing affiliate_url for: ${slug}`);
        return new Response(null, { status: 404 });
    }

    // Vertical Hint (Optional - Log only, do not block)
    const host = request.headers.get('host');
    const detectedVertical = getVerticalFromHost(host);
    
    if (detectedVertical && product.vertical !== detectedVertical) {
        console.warn(`[Redirect] Vertical Mismatch Hint: Host=${detectedVertical}, Product=${product.vertical}`);
        // We continue despite mismatch as per requirement "Hint only"
    }

    // Determine target URL: affiliate > official
    let targetUrl = product.affiliate_url || product.official_url;
    
    // Validar URL (basic check)
    if (!targetUrl || !targetUrl.startsWith('http')) {
        console.error(`[Redirect] Invalid target URL for ${slug}: ${targetUrl}`);
        return new Response(null, { status: 404 });
    }
    
    // Preserve UTMs and other tracking params
    targetUrl = preserveQueryParams(targetUrl, request.url);

    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error(`[Redirect] Critical Error for slug ${request.url}:`, error);
    return new Response(null, { status: 404 });
  }
}
