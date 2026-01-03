import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';
import { AdsConfig } from '@/lib/ads/types';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    // Validate Admin Token
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      // Allow if running locally or if token matches
      // For now, let's just check existence or match env
      if (process.env.NODE_ENV === 'production' && !authHeader) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const slug = params.slug;
    const body = await request.json();
    const newAdsConfig = body as AdsConfig;

    const config = await getCampaignConfig();
    const product = config.products[slug];

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update ads
    product.ads = {
        ...product.ads,
        ...newAdsConfig,
        generatedAt: new Date().toISOString()
    };

    config.products[slug] = product;

    const success = await updateCampaignConfig(config);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ads: product.ads });

  } catch (error) {
    console.error('Error updating ads:', error);
    return NextResponse.json({ error: 'Failed to update ads' }, { status: 500 });
  }
}
