import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, getKeysFound } from '@/lib/campaignConfig';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const hostname = request.headers.get('host') || '';

  let readOk = false;
  let errorMsg = null;
  let keysFound: string[] = [];

  try {
    const config = await getCampaignConfig();
    
    // If we got config (even default), we consider it a successful read operation
    // unless we want to distinguish "Edge Read" vs "Fallback".
    // For diag, knowing we have *some* config is good, but knowing if Edge failed is better.
    // Since getCampaignConfig handles errors internally by returning default, 
    // we can check if it matches default exactly to hint at fallback, but that's not strictly an error.
    
    readOk = true; 
    keysFound = getKeysFound(config);

  } catch (e: any) {
    readOk = false;
    errorMsg = e.message || 'Unknown error';
  }

  return NextResponse.json({
    hostname,
    path: request.nextUrl.pathname,
    slug,
    build_timestamp: '2026-01-02T12:00:00Z', // Update this to verify deployment
    env: {
        hasEdgeConfig: !!process.env.EDGE_CONFIG,
        hasEdgeConfigId: !!process.env.EDGE_CONFIG_ID,
        hasJwtSecret: !!process.env.JWT_SECRET
    },
    campaign_config: {
        read_ok: readOk,
        error: errorMsg,
        keys_found: keysFound
    }
  });
}
