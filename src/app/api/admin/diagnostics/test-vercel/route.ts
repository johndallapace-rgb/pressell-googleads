import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSystemConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getSystemConfig();
    const vercelToken = config.api_keys?.vercel;

    // STRICT: Config System Only
    if (!vercelToken) {
        return NextResponse.json({ success: false, error: 'NOT_CONFIGURED' });
    }

    // Live Ping: Get User Info
    const res = await fetch('https://api.vercel.com/v2/user', {
        headers: {
            'Authorization': `Bearer ${vercelToken}`
        }
    });
    
    if (!res.ok) {
        return NextResponse.json({ success: false, error: 'INVALID_TOKEN' });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, user: data.user?.username || 'Unknown' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
