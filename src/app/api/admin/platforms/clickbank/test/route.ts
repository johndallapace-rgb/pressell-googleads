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
    const { devKey, clerkKey, affiliateId } = await request.json();

    if (!devKey || !clerkKey) {
        return NextResponse.json({ error: 'Keys are required' }, { status: 400 });
    }

    // Call ClickBank API (Validation)
    const res = await fetch('https://api.clickbank.com/rest/1.3/orders/list', {
        method: 'GET',
        headers: {
            'Authorization': clerkKey, // CB Rest API uses Clerk Key in header
            'Accept': 'application/json'
        }
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('ClickBank Validation Failed:', res.status, text);
        return NextResponse.json({ error: `Validation Failed: ${res.status} (Ensure Clerk Key is correct)` }, { status: res.status });
    }

    // ✅ Validation Successful -> SAVE TO EDGE CONFIG
    // We store it encrypted (mock logic for now, or raw since it's server-side only config)
    // Edge Config is secure enough for this scale, but ideally we'd use env vars.
    // However, since we need dynamic updates without redeploy, Edge Config is the path.
    
    const currentConfig = await getCampaignConfig();
    
    // Create or Update Platforms object
    const newConfig = {
        ...currentConfig,
        platforms: {
            ...(currentConfig.platforms || {}),
            'ClickBank': {
                name: 'ClickBank',
                status: 'Connected',
                credentials: {
                    affiliate_id: affiliateId,
                    dev_key: devKey,
                    clerk_key: clerkKey
                }
            }
        }
    };

    // Save
    const updateRes = await updateCampaignConfig(newConfig as any);
    if (!updateRes.success) {
        throw new Error('Failed to save credentials to Edge Config: ' + updateRes.error);
    }

    return NextResponse.json({ success: true, message: 'ClickBank Connected & Saved' });

  } catch (error: any) {
    console.error('ClickBank Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
