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
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Source slug is required' }, { status: 400 });
    }

    const config = await getCampaignConfig();
    const sourceProduct = config.products?.[slug];

    if (!sourceProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate new unique slug
    let newSlug = `${slug}-copy`;
    let counter = 1;
    while (config.products?.[newSlug]) {
        newSlug = `${slug}-copy-${counter}`;
        counter++;
    }

    // Clone the object deeply
    const clonedProduct = JSON.parse(JSON.stringify(sourceProduct));
    
    // Update fields for the clone
    clonedProduct.slug = newSlug;
    clonedProduct.name = `${sourceProduct.name} (Copy)`;
    clonedProduct.status = 'draft'; // Set to draft for safety
    
    // Reset specific tracking if needed, but keep global pixel as requested
    // Ensure pixel is enforced
    if (!clonedProduct.google_ads_id) {
        clonedProduct.google_ads_id = '17850696537';
    }

    // Save to config
    if (!config.products) config.products = {};
    config.products[newSlug] = clonedProduct;

    const result = await updateCampaignConfig(config);

    if (!result.success) {
      throw new Error(result.error || 'Failed to save clone');
    }

    return NextResponse.json({ success: true, newSlug });

  } catch (error: any) {
    console.error('Clone failed:', error);
    return NextResponse.json({ error: error.message || 'Clone failed' }, { status: 500 });
  }
}
