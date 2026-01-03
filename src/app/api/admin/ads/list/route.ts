import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const vertical = searchParams.get('vertical') || '';
    const status = searchParams.get('status') || '';

    const config = await getCampaignConfig();
    let products = Object.values(config.products);

    // Filter
    products = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search) || p.slug.includes(search);
      const matchesVertical = vertical ? p.vertical === vertical : true;
      const matchesStatus = status ? p.ads?.status === status : true;
      return matchesSearch && matchesVertical && matchesStatus;
    });

    // Pagination
    const total = products.length;
    const start = (page - 1) * limit;
    const paginated = products.slice(start, start + limit).map(p => ({
      slug: p.slug,
      name: p.name,
      vertical: p.vertical,
      languages: [p.language], // Basic language, or extended if we support multi-lang
      adsStatus: p.ads?.status || 'draft',
      generatedAt: p.ads?.generatedAt || null,
      version: p.ads?.version || 1
    }));

    return NextResponse.json({
      products: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error listing ads:', error);
    return NextResponse.json({ error: 'Failed to list ads' }, { status: 500 });
  }
}
