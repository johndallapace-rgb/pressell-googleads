import { NextRequest, NextResponse } from 'next/server';
import { getSystemConfig, updateSystemConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();
        
        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }
        
        const sys = await getSystemConfig();
        const next: any = { ...(sys as any) };
        if (!next.api_keys || typeof next.api_keys !== 'object') next.api_keys = {};
        if (!next.platforms || typeof next.platforms !== 'object') next.platforms = {};
        if (!next.google_ads || typeof next.google_ads !== 'object') next.google_ads = {};
        
        next.google_ads.refresh_token = String(token);
        next.api_keys.google_ads_refresh_token = String(token);

        const ok = await updateSystemConfig(next);
        if (!ok) {
            return NextResponse.json({ error: 'Failed to persist token' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[System] Failed to save token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
