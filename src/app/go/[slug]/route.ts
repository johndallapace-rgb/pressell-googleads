import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/config';
import { getVerticalFromHost } from '@/lib/host';

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
  const { slug } = await params;
  
  if (!slug) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const product = await getProduct(slug);

  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  // Vertical Check
  const host = request.headers.get('host');
  const detectedVertical = getVerticalFromHost(host);
  
  if (detectedVertical && product.vertical !== detectedVertical) {
      // If we are on health.domain.com but product is 'diy', redirect to offline or home
      return NextResponse.redirect(new URL('/offline', request.url));
  }

  // Determine target URL: affiliate > official
  let targetUrl = product.affiliate_url || product.official_url;
  
  if (!targetUrl) {
    return NextResponse.redirect(new URL('/offline', request.url));
  }

  // Preserve UTMs and other tracking params
  targetUrl = preserveQueryParams(targetUrl, request.url);

  // Apply internal tracking logic (if any additional processing is needed from tracking lib)
  // Note: buildOutgoingUrl might assume client-side localStorage, so we rely on server-side query params mostly here.
  // But if we had server-side cookies we could use them. For now query params are the reliable source.

  return NextResponse.redirect(targetUrl, { status: 302 });
}
