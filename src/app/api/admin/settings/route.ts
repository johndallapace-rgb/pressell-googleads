import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, updateCampaignConfig } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await getCampaignConfig();
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newConfig = await request.json();
    
    // Basic validation
    if (!newConfig.products) {
       return NextResponse.json({ error: 'Invalid config structure' }, { status: 400 });
    }

    const success = await updateCampaignConfig(newConfig);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
