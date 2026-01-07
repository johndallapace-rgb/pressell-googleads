import { NextRequest, NextResponse } from 'next/server';
import { cleanupGhostKeys } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    // 1. Auth Check
    const cookieToken = request.cookies.get('admin_token')?.value;
    const authHeader = request.headers.get('Authorization');
    let authorized = false;

    if (cookieToken && await verifyToken(cookieToken)) authorized = true;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === process.env.ADMIN_TOKEN || await verifyToken(token)) authorized = true;
    }

    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cleanup API] Starting KV cleanup...');
        const result = await cleanupGhostKeys();
        console.log(`[Cleanup API] Deleted ${result.deleted.length} keys.`);
        
        return NextResponse.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${result.deleted.length} ghost keys.`,
            details: result
        });
    } catch (e: any) {
        console.error('[Cleanup API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}