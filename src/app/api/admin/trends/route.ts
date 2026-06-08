import { NextRequest, NextResponse } from 'next/server';
import { buildCurrentTrendsSnapshot, refreshTrendsSnapshot } from '@/lib/server/admin-trends';
import { isAdminRequestAuthorized } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await buildCurrentTrendsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load trends snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await refreshTrendsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to refresh trends snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
