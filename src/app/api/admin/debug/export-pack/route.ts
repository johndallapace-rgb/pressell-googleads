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
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'engineer';
        console.log(`[DebugPack] Starting AI Tool: ${mode}`);
        
        // Map mode to script command
        let scriptName = 'debug-pack.js'; // Default (Engineer Mode)
        let args = '';

        if (['architect', 'bug-hunter', 'performance', 'seo'].includes(mode)) {
            scriptName = 'ai-tools.js';
            args = mode;
        }

        const scriptPath = path.resolve(process.cwd(), 'scripts', scriptName);
        const cmd = `node "${scriptPath}" ${args}`;
        
        return new Promise((resolve) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('[DebugPack] Script failed:', stderr);
                    resolve(NextResponse.json({ error: 'Generation failed: ' + stderr }, { status: 500 }));
                    return;
                }
                
                console.log('[DebugPack] Generation complete:', stdout);
                
                let message = 'AI Debug Pack generated.';
                if (mode === 'architect') message = 'Architecture Report generated.';
                if (mode === 'bug-hunter') message = 'Bug Hunter Report generated.';
                if (mode === 'performance') message = 'Performance Report generated.';
                if (mode === 'seo') message = 'SEO Report generated.';

                resolve(NextResponse.json({ 
                    success: true, 
                    message,
                    path: '/debug/'
                }));
            });
        });

    } catch (e: any) {
        console.error('[DebugPack] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
