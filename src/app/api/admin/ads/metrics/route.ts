import { NextRequest, NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerId = '338-031-9096';
    
    // Check Env Vars
    if (!process.env.GOOGLE_ADS_REFRESH_TOKEN || !process.env.GOOGLE_ADS_CLIENT_ID) {
        throw new Error('Missing Environment Variables (GOOGLE_ADS_REFRESH_TOKEN)');
    }

    const metrics = await GoogleAds.getCampaignMetrics(customerId);
    
    return NextResponse.json({
        success: true,
        metrics
    });

  } catch (error: any) {
    console.error('[AdsMetrics] Error:', error);
    return NextResponse.json({ 
        error: error.message || 'Unknown Error',
        details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 });
  }
}
