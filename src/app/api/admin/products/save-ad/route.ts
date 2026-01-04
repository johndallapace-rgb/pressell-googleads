import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug, ad_variation } = await request.json();

    if (!slug || !ad_variation) {
      return NextResponse.json({ error: 'Slug and Ad Variation are required' }, { status: 400 });
    }

    const config = await getCampaignConfig();
    const product = config.products?.[slug];

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Initialize ads structure if missing
    if (!product.ads) {
        product.ads = {
            status: 'draft',
            campaigns: []
        };
    }

    // Create a new campaign or append to existing? 
    // Let's append a new AdGroup to the first campaign, or create a new campaign if none exists.
    let campaign = product.ads.campaigns?.[0];
    
    if (!campaign) {
        campaign = {
            campaignName: `${product.name} - Spy Campaigns`,
            adGroups: []
        };
        product.ads.campaigns = [campaign];
    }

    // Create new Ad Group from Variation
    const newAdGroup = {
        name: `Spy: ${ad_variation.name} - ${new Date().toLocaleDateString()}`,
        keywords: [`${product.name} review`, `buy ${product.name}`], // Basic default keywords
        ads: [{
            headlines: ad_variation.headlines,
            descriptions: ad_variation.descriptions,
            finalUrl: product.official_url || '',
            // If the variation has tracking setup, we could store it in a custom field or append to URL
            // For now, we stick to the standard schema
        }]
    };

    campaign.adGroups.push(newAdGroup);

    // Save
    const saveResult = await updateCampaignConfig(config);

    if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save to Edge Config');
    }

    return NextResponse.json({ success: true, campaignName: campaign.campaignName });

  } catch (error: any) {
    console.error('Ad Save failed:', error);
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}
