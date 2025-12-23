import { NextRequest, NextResponse } from 'next/server';
import { updateCampaignConfig } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Verify auth
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newConfig = await request.json();
  const success = await updateCampaignConfig(newConfig);

  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'Failed to update Edge Config' }, { status: 500 });
  }
}
