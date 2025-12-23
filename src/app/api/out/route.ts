import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slugParam = searchParams.get('slug');
  const affParam = searchParams.get('aff') || searchParams.get(process.env.NEXT_PUBLIC_AFFILIATE_PARAM || 'aff');

  const config = await getCampaignConfig();
  const slug = slugParam || config.active_product_slug;
  const product = config.products[slug];

  if (!product) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  let destination = product.affiliate_url;

  // Append affiliate param if present and not already in URL
  if (affParam) {
    const url = new URL(destination);
    if (!url.searchParams.has('aff')) {
      url.searchParams.set('aff', affParam);
    }
    destination = url.toString();
  }

  // Preserve other tracking params (gclid, etc) if needed, 
  // but usually affiliate link handles its own. 
  // If we want to pass through all params:
  const urlObj = new URL(destination);
  searchParams.forEach((value, key) => {
    if (key !== 'slug' && key !== 'aff' && !urlObj.searchParams.has(key)) {
      urlObj.searchParams.set(key, value);
    }
  });
  destination = urlObj.toString();

  return NextResponse.redirect(destination, 302);
}
