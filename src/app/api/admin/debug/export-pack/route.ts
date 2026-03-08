import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { exec } from 'child_process';
import path from 'path';

export const runtime = 'nodejs'; // Required for child_process

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
        console.log('[DebugPack] Starting AI Debug Pack generation...');
        
        // Run the script
        const scriptPath = path.resolve(process.cwd(), 'scripts/debug-pack.js');
        
        return new Promise((resolve) => {
            exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('[DebugPack] Script failed:', stderr);
                    resolve(NextResponse.json({ error: 'Generation failed: ' + stderr }, { status: 500 }));
                    return;
                }
                
                console.log('[DebugPack] Generation complete:', stdout);
                resolve(NextResponse.json({ 
                    success: true, 
                    message: 'AI Debug Pack generated in /debug/ai-debug-pack.zip',
                    path: '/debug/ai-debug-pack.zip'
                }));
            });
        });

    } catch (e: any) {
        console.error('[DebugPack] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
