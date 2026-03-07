import { NextResponse } from 'next/server';
import { getCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const config = await getCampaignConfig();
        const hasToken = !!(
            process.env.GOOGLE_ADS_REFRESH_TOKEN || 
            config.system?.api_keys?.google_ads_refresh_token
        );
        
        return NextResponse.json({ 
            status: hasToken ? 'ONLINE' : 'OFFLINE',
            hasToken 
        });
    } catch (e) {
        return NextResponse.json({ status: 'ERROR' }, { status: 500 });
    }
}
