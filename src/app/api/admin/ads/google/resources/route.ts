import { NextRequest, NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const customerId = searchParams.get('customerId');
    const campaignId = searchParams.get('campaignId');

    if (type === 'customers') {
        const customers = await GoogleAds.listAccessibleCustomers();
        // customers is array of "customers/123456"
        // Let's format them
        const formatted = customers.map((c: string) => ({
            id: c.split('/')[1],
            name: `Account ${c.split('/')[1]}` // We don't have names easily without more queries
        }));
        return NextResponse.json(formatted);
    }

    if (type === 'campaigns') {
        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        const campaigns = await GoogleAds.listCampaigns(customerId);
        return NextResponse.json(campaigns);
    }

    if (type === 'adgroups') {
        if (!customerId || !campaignId) return NextResponse.json({ error: 'Customer ID and Campaign ID required' }, { status: 400 });
        const adGroups = await GoogleAds.listAdGroups(customerId, campaignId);
        return NextResponse.json(adGroups);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error: any) {
    console.error('Google Ads Resource Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
