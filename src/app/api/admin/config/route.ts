import { NextRequest, NextResponse } from 'next/server';
import { getSystemConfig, updateSystemConfig, SystemConfig } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token && request.headers.get('Authorization') !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    if (token && !(await verifyToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
      const config = await getSystemConfig();
      return NextResponse.json(config);
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token && request.headers.get('Authorization') !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    if (token && !(await verifyToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
      const newConfig: SystemConfig = await request.json();
      
      // Basic Validation
      if (!newConfig.api_keys) newConfig.api_keys = {};
      if (!newConfig.platforms) newConfig.platforms = {};
      
      const success = await updateSystemConfig(newConfig);
      
      if (success) {
          return NextResponse.json({ success: true });
      } else {
          throw new Error('Failed to update system config');
      }
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
