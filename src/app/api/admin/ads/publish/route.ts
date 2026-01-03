import { NextRequest, NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        slug, 
        customerId, 
        adGroupId, 
        campaignId, // Passed for logging
        adData 
    } = body;

    if (!slug || !customerId || !adGroupId || !adData) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Publish to Google Ads
    const resourceName = await GoogleAds.publishAd(customerId, adGroupId, adData);

    // 2. Update Local Config
    const config = await getCampaignConfig();
    const product = config.products[slug];

    if (product && product.ads) {
        product.ads.status = 'published';
        product.ads.publication = {
            at: new Date().toISOString(),
            customerId,
            campaignId,
            adGroupId,
            adResourceName: resourceName
        };
        
        await updateCampaignConfig(config);
    }

    return NextResponse.json({ 
        success: true, 
        resourceName,
        publication: product?.ads?.publication 
    });

  } catch (error: any) {
    console.error('Publish Ad Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish ad' }, { status: 500 });
  }
}
