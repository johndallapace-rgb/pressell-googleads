import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { affiliateId, apiKey, multiCurrency } = await request.json();

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    // Call Digistore24 API (Validation)
    // Using /api/list_orders as a test
    // Digistore24 API requires Header: "X-DS-API-KEY: YOUR_KEY"
    
    const res = await fetch('https://www.digistore24.com/api/call/list_orders', {
        method: 'GET',
        headers: {
            'X-DS-API-KEY': apiKey,
            'Accept': 'application/json'
        }
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('Digistore24 Validation Failed:', res.status, text);
        // Note: Digistore often returns 200 even on logical errors, but assuming standard HTTP codes for auth fail
        // If it fails, return error
        return NextResponse.json({ error: `Validation Failed: ${res.status} (Check API Key)` }, { status: res.status });
    }

    // Save to Edge Config
    const currentConfig = await getCampaignConfig();
    
    const newConfig = {
        ...currentConfig,
        platforms: {
            ...(currentConfig.platforms || {}),
            'Digistore24': {
                name: 'Digistore24',
                status: 'Connected',
                credentials: {
                    affiliate_id: affiliateId,
                    api_key: apiKey,
                    multi_currency: multiCurrency
                }
            }
        }
    };

    const updateRes = await updateCampaignConfig(newConfig as any);
    if (!updateRes.success) {
        throw new Error('Failed to save credentials: ' + updateRes.error);
    }

    return NextResponse.json({ success: true, message: 'Digistore24 Connected' });

  } catch (error: any) {
    console.error('Digistore24 Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
