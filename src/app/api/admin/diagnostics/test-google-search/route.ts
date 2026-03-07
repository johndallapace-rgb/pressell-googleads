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
    const apiKey = config.api_keys?.google_search_key;
    const cx = config.api_keys?.google_search_cx;

    // STRICT: Do not fallback to env vars. Config System is the source of truth.
    if (!apiKey || !cx) {
        return NextResponse.json({ success: false, error: 'NOT_CONFIGURED' });
    }

    // Live Ping: Search for "test"
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test&num=1`);
    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ 
            success: false, 
            error: data.error?.message || 'INVALID_KEY',
            details: data
        });
    }

    return NextResponse.json({ success: true, message: 'Search Successful' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
