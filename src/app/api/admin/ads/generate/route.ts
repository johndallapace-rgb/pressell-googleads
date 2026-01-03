import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, getProduct, updateCampaignConfig } from '@/lib/config';
import { generateCampaigns } from '@/lib/ads/generator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Auth Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await request.json();
    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

    const product = await getProduct(slug);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Generate Ads
    const campaigns = generateCampaigns(product);

    // Save to Edge Config (ads_config key)
    // We reuse updateCampaignConfig logic but targeting a different key if possible,
    // OR we store it inside campaign_config to simplify (since updateCampaignConfig is hardcoded to campaign_config).
    // Given the previous instructions, we should probably stick to campaign_config for simplicity 
    // OR create a generic update helper.
    // For now, let's just return the generated data to the client for export/preview.
    // Storing generated ads in Edge Config might bloat it quickly (4KB limit issues potentially).
    // Better to generate on-demand.

    return NextResponse.json({ success: true, campaigns });

  } catch (error) {
    console.error('[Ads Generate Error]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
