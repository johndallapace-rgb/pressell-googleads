import { NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const customerId = '3380319096';
        
        // Debug: Print token scopes (if possible) or just try a lighter call
        console.log(`[TestPermission] Testing access to ${customerId}`);

        const campaigns = await GoogleAds.listCampaigns(customerId);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Access Validated (No Header)',
            campaignCount: campaigns.length 
        });
    } catch (e: any) {
        console.error('[TestPermission] Failed:', e.message);
        return NextResponse.json({ 
            success: false, 
            error: e.message 
        }, { status: 200 }); 
    }
}
