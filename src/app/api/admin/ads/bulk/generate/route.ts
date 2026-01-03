import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig, ProductConfig } from '@/lib/config';
import { generateCampaigns } from '@/lib/ads/generator';
import { getStrategyRecommendation } from '@/lib/ads/strategyPlanner';
import { AdsConfig } from '@/lib/ads/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { slugs } = await request.json();

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: 'No slugs provided' }, { status: 400 });
    }

    // Limit batch size to prevent timeout
    if (slugs.length > 20) {
      return NextResponse.json({ error: 'Batch size too large (max 20)' }, { status: 400 });
    }

    const config = await getCampaignConfig();
    let updatedCount = 0;

    // Process each slug
    for (const slug of slugs) {
      const product = config.products[slug];
      if (!product) continue;

      // 1. Get or Default Strategy
      let strategy = product.ads?.settings;
      if (!strategy) {
        const recommendation = getStrategyRecommendation(product.vertical, product.language);
        strategy = recommendation.settings;
      }

      // 2. Generate Campaigns
      // We pass the strategy to the generator if the generator supported it (it currently doesn't, it uses defaults/templates)
      // Future improvement: Pass strategy to generateCampaigns to control budget/bids in the output object
      const campaigns = generateCampaigns(product);

      // 3. Update Product Ads Config
      const newAdsConfig: AdsConfig = {
        slug: product.slug,
        vertical: product.vertical,
        languages: [product.language], // Expand if multi-lang supported
        status: 'ready',
        generatedAt: new Date().toISOString(),
        version: 1, // TODO: Increment if exists
        settings: strategy,
        campaigns: campaigns
      };

      config.products[slug].ads = newAdsConfig;
      updatedCount++;
    }

    if (updatedCount > 0) {
      const success = await updateCampaignConfig(config);
      if (!success) {
        return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: updatedCount });

  } catch (error) {
    console.error('Bulk generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
