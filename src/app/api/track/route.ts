import { NextRequest, NextResponse } from 'next/server';
import { getCampaignMetrics, CampaignMetrics } from '@/lib/config';

export const runtime = 'nodejs';

// Config constants
const FLUSH_INTERVAL_MS = 30000;
const MAX_PENDING = 100;

// Global buffer definition
type MetricsBuffer = CampaignMetrics;

interface TrackingGlobals {
  buffer: MetricsBuffer;
  lastFlushTs: number;
  pendingCount: number;
}

const globalForTracking = globalThis as unknown as {
  tracking: TrackingGlobals;
};

if (!globalForTracking.tracking) {
  globalForTracking.tracking = {
    buffer: {},
    lastFlushTs: Date.now(),
    pendingCount: 0,
  };
}

const { tracking } = globalForTracking;

function mergeMetrics(target: CampaignMetrics, source: MetricsBuffer) {
  for (const slug in source) {
    if (!target[slug]) target[slug] = {};
    for (const variant in source[slug]) {
      if (!target[slug][variant]) target[slug][variant] = { views: 0, clicks: 0 };
      
      target[slug][variant].views += source[slug][variant].views;
      target[slug][variant].clicks += source[slug][variant].clicks;
    }
  }
}

async function flushMetrics() {
  if (!process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID) {
    console.log('[Mock Flush] Skipping flush (no credentials)');
    tracking.buffer = {};
    tracking.pendingCount = 0;
    tracking.lastFlushTs = Date.now();
    return;
  }

  // Create a snapshot of current buffer to flush
  const bufferSnapshot = JSON.parse(JSON.stringify(tracking.buffer));
  
  // Reset global buffer immediately to capture new events while flushing
  tracking.buffer = {};
  tracking.pendingCount = 0;
  tracking.lastFlushTs = Date.now();

  try {
    // 1. Fetch current metrics
    const currentMetrics = await getCampaignMetrics();
    
    // 2. Merge buffer snapshot into current metrics
    mergeMetrics(currentMetrics, bufferSnapshot);

    // 3. Update Edge Config
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
              operation: 'upsert',
              key: 'campaign_metrics',
              value: currentMetrics,
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      throw new Error(`Edge Config update failed: ${updateRes.status} ${updateRes.statusText} - ${await updateRes.text()}`);
    }

    console.log('[Flush] Successfully updated metrics');

  } catch (error) {
    console.error('[Flush Error]', error);
    
    // Restore buffer on failure (merge snapshot back into global buffer)
    mergeMetrics(tracking.buffer, bufferSnapshot);
    // Restore count estimate (simplified)
    // We don't know exactly how many items were in snapshot vs new items, 
    // but merging ensures we don't lose data.
    // We can just increment pendingCount by a safe amount or ignore it since buffer is dirty now.
    // Let's at least mark it as having pending items so it tries again later.
    tracking.pendingCount += 1; 
  }
}

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

    // 1. Increment Buffer
    if (!tracking.buffer[slug]) tracking.buffer[slug] = {};
    if (!tracking.buffer[slug][variant]) tracking.buffer[slug][variant] = { views: 0, clicks: 0 };

    if (event === 'view') tracking.buffer[slug][variant].views++;
    if (event === 'click') tracking.buffer[slug][variant].clicks++;

    tracking.pendingCount++;

    // 2. Check Flush Conditions
    const now = Date.now();
    const timeSinceFlush = now - tracking.lastFlushTs;
    const shouldFlush = timeSinceFlush >= FLUSH_INTERVAL_MS || tracking.pendingCount >= MAX_PENDING;

    if (shouldFlush) {
      // We await here to ensure the serverless function doesn't exit before flushing
      // In a real long-running server we wouldn't await, but Vercel functions are ephemeral.
      await flushMetrics();
    }

    return NextResponse.json({ success: true, queued: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
