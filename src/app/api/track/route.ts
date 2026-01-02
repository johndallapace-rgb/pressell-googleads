import { NextRequest, NextResponse } from 'next/server';
import { getCampaignMetrics } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { slug, variant, event } = await request.json();

    if (!slug || !variant || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real high-scale scenario, we would use a proper DB (Redis, Postgres, Tinybird).
    // Edge Config has a write limit (1 request per second for free tier, but limited writes overall).
    // HOWEVER, the prompt specifically asked to "armazenar contadores no Edge Config".
    // We will simulate the "logic" here but warn that for production this needs a real DB.
    // Since we cannot easily write to Edge Config from a public API route without exposing the token
    // or hitting rate limits, we will log it for now and assume a background job or separate service 
    // would aggregate this. 
    
    // BUT, to satisfy the requirement "entregar endpoints", we will implement the update logic
    // assuming low traffic or just for demonstration.
    
    if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
       console.log(`[MOCK TRACKING] ${event} - ${slug} (${variant})`);
       return NextResponse.json({ success: true, mock: true });
    }

    // We need to fetch current metrics, update, and save.
    // This is NOT concurrency safe.
    
    // Optimistic update attempt (simplified)
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
        console.error('Failed to update metrics in Edge Config');
        return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
