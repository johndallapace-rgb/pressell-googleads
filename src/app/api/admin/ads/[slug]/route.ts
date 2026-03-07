import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const config = await getCampaignConfig();
    const product = config.products[slug];

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
        ads: product.ads || null,
        productName: product.name,
        officialUrl: product.official_url
    });

  } catch (error) {
    console.error('Error fetching ad details:', error);
    return NextResponse.json({ error: 'Failed to fetch ad details' }, { status: 500 });
  }
}
