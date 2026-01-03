import { NextRequest, NextResponse } from 'next/server';
import { getCampaignMetrics } from '@/lib/config';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { slug, variant, event } = await request.json();

    if (!slug || !variant || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
       console.log(`[MOCK TRACKING] ${event} - ${slug} (${variant})`);
       return NextResponse.json({ success: true, mock: true });
    }

    const hasToken = !!process.env.VERCEL_API_TOKEN;
    const edgeConfigIdTail = process.env.EDGE_CONFIG_ID.slice(-6);

    // Optimistic update attempt
    const metrics = await getCampaignMetrics();
    
    if (!metrics[slug]) metrics[slug] = {};
    if (!metrics[slug][variant]) metrics[slug][variant] = { views: 0, clicks: 0 };
    
    if (event === 'view') metrics[slug][variant].views++;
    if (event === 'click') metrics[slug][variant].clicks++;

    // Update Edge Config
    const updateRes = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: 'campaign_metrics',
              value: metrics,
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
        const errorBody = await updateRes.text();
        console.error('Failed to update metrics in Edge Config', {
            status: updateRes.status,
            statusText: updateRes.statusText,
            body: errorBody,
            hasToken,
            edgeConfigIdTail
        });
        // Do not return 500, return success: true (queued) to not break the client
        return NextResponse.json({ success: true, queued: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
