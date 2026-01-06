import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig, ProductConfig } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { product } = await request.json() as { product: ProductConfig };
    
    if (!product || !product.slug) {
       return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
    }

    const config = await getCampaignConfig();
    
    // Update or Add product
    // Merge Strategy: Keep existing fields, only update new ones
    const existing = config.products[product.slug] || {};
    config.products[product.slug] = {
        ...existing,
        ...product
    };

    const success = await updateCampaignConfig(config);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
