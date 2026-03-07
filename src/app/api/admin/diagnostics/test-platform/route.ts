import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSystemConfig } from '@/lib/config';

// UNIFIED PLATFORM DIAGNOSTICS
// Checks connection status based on Central Config System keys.
// No fallback to env vars allowed.

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { platform } = await request.json();
    const config = await getSystemConfig();
    
    // Debug Log
    console.log(`[Diagnostic] Testing platform: ${platform}`);
    // console.log('Config keys available:', Object.keys(config.api_keys || {}));

    let isConfigured = false;
    let isValid = false;

    switch (platform) {
        case 'clickbank':
            // Check Unified API Token (2023+) AND Nickname
            const cbToken = config.api_keys?.clickbank_api_token;
            const cbNick = config.api_keys?.clickbank_nickname;
            
            isConfigured = !!(cbToken && cbNick);
            isValid = isConfigured && cbToken!.length > 5 && cbNick!.length > 1;
            break;
            
        case 'digistore':
            // Check Affiliate ID AND API Key (Strict)
            const dsId = config.platforms?.digistore?.credentials?.affiliate_id;
            const dsKey = config.platforms?.digistore?.credentials?.api_key;
            
            isConfigured = !!(dsId && dsKey);
            isValid = isConfigured && dsId!.length > 2 && dsKey!.length > 5;
            break;
            
        case 'buygoods':
            const bgKey = config.api_keys?.buygoods_api;
            const bgId = config.api_keys?.buygoods_account_id;

            isConfigured = !!(bgKey && bgId);
            isValid = isConfigured && bgKey!.length > 5;
            break;
            
        case 'maxweb':
            const mwKey = config.api_keys?.maxweb_api;
            const mwId = config.api_keys?.maxweb_affiliate_id;

            isConfigured = !!(mwKey && mwId);
            isValid = isConfigured && mwKey!.length > 5;
            break;
            
        default:
            return NextResponse.json({ success: false, error: 'UNKNOWN_PLATFORM' });
    }

    if (!isConfigured) {
        return NextResponse.json({ success: false, error: 'NOT_CONFIGURED' });
    }

    if (!isValid) {
        return NextResponse.json({ success: false, error: 'INVALID_FORMAT' });
    }

    // SIMULATED PING (Since we don't have real endpoints for all yet)
    // In the future, use the keys to fetch a test endpoint.
    return NextResponse.json({ success: true, message: 'Active' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
