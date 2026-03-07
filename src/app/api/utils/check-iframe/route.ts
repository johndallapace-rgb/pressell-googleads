import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ canLoad: false });

    try {
        const res = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
        });

        const xFrame = res.headers.get('x-frame-options');
        const csp = res.headers.get('content-security-policy');

        // Check X-Frame-Options
        if (xFrame) {
            const val = xFrame.toLowerCase();
            if (val === 'deny' || val === 'sameorigin') {
                return NextResponse.json({ canLoad: false, reason: 'x-frame-options' });
            }
        }

        // Check CSP frame-ancestors
        if (csp) {
            if (csp.includes('frame-ancestors')) {
                // If it restricts ancestors, it likely blocks us unless we are whitelisted (unlikely)
                // If it says 'frame-ancestors *', it's fine.
                if (!csp.includes('frame-ancestors *') && !csp.includes('frame-ancestors https:')) {
                     return NextResponse.json({ canLoad: false, reason: 'csp' });
                }
            }
        }

        return NextResponse.json({ canLoad: true });
    } catch (e) {
        console.error('Iframe Check Failed:', e);
        // If fetch fails, we assume it might be block/network issue, so fallback to image
        return NextResponse.json({ canLoad: false, error: 'fetch_failed' });
    }
}