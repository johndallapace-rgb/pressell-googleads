import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, getKeysFound } from '@/lib/campaignConfig';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    hasEdgeConfig: !!process.env.EDGE_CONFIG,
    hasEdgeConfigId: !!process.env.EDGE_CONFIG_ID,
  };

  let edgeReadStatus = 'not_attempted';
  let keysFound: string[] = [];
  let errorMsg = null;

  try {
    const config = await getCampaignConfig();
    edgeReadStatus = 'success';
    keysFound = getKeysFound(config);
  } catch (error: any) {
    edgeReadStatus = 'failed';
    errorMsg = error.message;
    console.error('[HealthCheck] EDGE_CONFIG_READ_FAILED:', error);
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env,
    edge_config: {
      read_status: edgeReadStatus,
      keys_found: keysFound,
      error: errorMsg
    }
  });
}
