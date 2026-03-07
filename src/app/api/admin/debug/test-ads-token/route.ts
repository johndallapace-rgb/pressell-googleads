import { NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Manual Config Loader
async function getManualConfig() {
    // 1. Try to read .env.local directly
    const envPath = path.join(process.cwd(), '.env.local');
    let refreshToken = '';
    
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GOOGLE_ADS_REFRESH_TOKEN=(.*)/);
        if (match && match[1]) {
            refreshToken = match[1].trim();
        }
    }

    if (!refreshToken) {
        throw new Error('No token found in .env.local');
    }

    return {
        clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        refreshToken
    };
}

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

    try {
        log('Starting Token Verification...');
        
        // 1. Load Config Manually
        const config = await getManualConfig();
        log(`Loaded Config. ClientID: ${config.clientId.slice(0, 5)}... Token: ${config.refreshToken.slice(0, 5)}...`);

        if (!config.clientId || !config.clientSecret) {
            throw new Error('Missing Client ID or Secret in env');
        }

        // 2. Refresh Access Token
        log('Requesting Access Token from Google...');
        const params = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
            grant_type: 'refresh_token',
        });

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenRes.ok) {
            log(`Auth Failed: ${JSON.stringify(tokenData)}`);
            throw new Error(tokenData.error_description || tokenData.error || 'Auth Failed');
        }

        const accessToken = tokenData.access_token;
        log('Access Token Acquired!');

        // 3. Test API Call (List Customers)
        // TRY NEWER VERSION (v19) since v17 is 404 (Sunset)
        log('Testing API: customers:listAccessibleCustomers (v19)');
        const apiRes = await fetch('https://googleads.googleapis.com/v19/customers:listAccessibleCustomers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': config.developerToken,
                'Content-Type': 'application/json'
            }
        });

        const rawText = await apiRes.text();
        log(`API Status: ${apiRes.status}`);
        // log(`API Response: ${rawText.slice(0, 500)}`); // Peek first 500 chars

        let apiData;
        try {
            apiData = JSON.parse(rawText);
        } catch (e) {
            log(`Failed to parse JSON: ${rawText.slice(0, 200)}`);
            throw new Error(`Invalid JSON response from Google: ${apiRes.status}`);
        }
        
        if (!apiRes.ok) {
            log(`API Call Failed: ${JSON.stringify(apiData)}`);
            throw new Error(apiData.error?.message || 'API Call Failed');
        }

        log(`API Success! Customers found: ${apiData.resourceNames?.length || 0}`);

        // 4. Update KV (Force Sync)
        log('Updating KV with verified token...');
        const currentConfig = await getCampaignConfig();
        if (!currentConfig.system) currentConfig.system = { api_keys: {}, platforms: {} };
        if (!currentConfig.system.api_keys) currentConfig.system.api_keys = {};
        
        currentConfig.system.api_keys.google_ads_refresh_token = config.refreshToken;
        
        const saveRes = await updateCampaignConfig(currentConfig);
        if (saveRes.success) {
            log('KV Updated Successfully.');
        } else {
            log('KV Update Failed: ' + saveRes.error);
        }

        return NextResponse.json({ success: true, logs });

    } catch (e: any) {
        log(`FATAL ERROR: ${e.message}`);
        // Return 200 to see logs in browser/curl easily
        return NextResponse.json({ success: false, error: e.message, logs }, { status: 200 });
    }
}
