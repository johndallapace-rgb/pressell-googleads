import { NextResponse } from 'next/server';
import { kv } from '@/lib/config';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!kv) {
        return NextResponse.json({ success: false, error: 'KV Client not initialized (Check env vars)' }, { status: 500 });
    }

    // Write a test key
    const testKey = 'diagnostics:test-connection';
    const testValue = { timestamp: Date.now(), status: 'ok' };
    
    await kv.set(testKey, testValue);
    
    // Read it back
    const readValue = await kv.get(testKey);
    
    if (!readValue) {
        return NextResponse.json({ success: false, error: 'Write succeeded but Read failed (Value is null)' }, { status: 500 });
    }

    // Clean up
    await kv.del(testKey);

    return NextResponse.json({ 
        success: true, 
        message: 'Write/Read/Delete Cycle Successful' 
    });

  } catch (error: any) {
    console.error('[KV Test] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
