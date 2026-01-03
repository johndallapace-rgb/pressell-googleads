import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Ideally protected, but for setup we allow it temporarily or check a query secret
    // const auth = request.nextUrl.searchParams.get('key');
    // if (auth !== process.env.SETUP_KEY) ...

    const config = await getCampaignConfig();
    const productSlug = 'mitolyn';
    
    // Find Mitolyn
    // Try exact slug or search by name
    let product = config.products[productSlug];
    
    if (!product) {
        // Fallback search
        const foundKey = Object.keys(config.products).find(k => 
            config.products[k].name.toLowerCase().includes('mitolyn')
        );
        if (foundKey) product = config.products[foundKey];
    }

    if (!product) {
        return NextResponse.json({ error: 'Mitolyn product not found' }, { status: 404 });
    }

    // Update Data
    product.google_ads_id = '17850696537';
    product.google_ads_label = 'DPCoCMK5h9wbENmG8L9C';

    // Save
    config.products[product.slug] = product;
    const success = await updateCampaignConfig(config);

    if (success) {
        return NextResponse.json({ success: true, product });
    } else {
        return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
