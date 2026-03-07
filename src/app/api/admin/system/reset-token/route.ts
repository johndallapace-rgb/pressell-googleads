import { NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST() {
    try {
        console.log('[System] Resetting Google Ads Token...');

        // 1. Clear from KV
        const config = await getCampaignConfig();
        if (config.system?.api_keys?.google_ads_refresh_token) {
            delete config.system.api_keys.google_ads_refresh_token;
            await updateCampaignConfig(config);
            console.log('[System] Token removed from KV');
        }

        // 2. Clear from .env.local
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('GOOGLE_ADS_REFRESH_TOKEN=')) {
                // Remove the line entirely or set to empty
                envContent = envContent.replace(/GOOGLE_ADS_REFRESH_TOKEN=.*\n?/g, '');
                fs.writeFileSync(envPath, envContent);
                console.log('[System] Token removed from .env.local');
            }
        }

        return NextResponse.json({ success: true, message: 'Token reset successfully' });
    } catch (error: any) {
        console.error('[System] Failed to reset token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
