import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { urls } = await request.json();
    if (!Array.isArray(urls)) {
        return NextResponse.json({ error: 'Invalid URLs array' }, { status: 400 });
    }

    const results = await Promise.all(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8s
            
            // Log for debugging
            // console.log(`[CheckLink] Pinging: ${url}`);

            const res = await fetch(url, { 
                method: 'HEAD', 
                signal: controller.signal,
                headers: { 
                    'User-Agent': 'PressellBot/1.0',
                    'Cache-Control': 'no-cache, no-store' // Bypass Vercel Cache
                }
            });
            clearTimeout(timeoutId);
            
            // Allow 200, 301, 302, 307, 308
            const isOk = res.ok || (res.status >= 300 && res.status < 400);
            
            if (!isOk) {
                console.log(`[CheckLink] Failed: ${url} -> ${res.status}`);
            }

            return { url, status: res.status, ok: isOk };
        } catch (e: any) {
            return { url, status: 0, ok: false, error: e.message };
        }
    }));

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
