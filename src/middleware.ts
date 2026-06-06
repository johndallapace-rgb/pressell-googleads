import { NextRequest, NextResponse } from 'next/server';

// Security Headers
const SECURITY_HEADERS = {
    'X-Frame-Options': 'SAMEORIGIN', // Allows iframes on same origin (needed for some trackers?)
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()', // Disable unused features
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Force HTTPS
};

// Paths to Protect
const ADMIN_PATH = '/admin';
const API_ADMIN_PATH = '/api/admin';
const PUBLIC_ASSETS = ['/images', '/fonts', '/icons'];

// Bot Detection (Simple User-Agent Check)
const BAD_BOTS = ['SemrushBot', 'AhrefsBot', 'DotBot', 'MJ12bot', 'PetalBot', 'Bytespider', 'Serpstat', 'Baiduspider', 'YandexBot'];

// Google & Allowed Services (Never Block)
const ALLOWED_BOTS = ['Googlebot', 'AdsBot-Google', 'Google-InspectionTool', 'Chrome-Lighthouse', 'Mediapartners-Google'];

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const path = url.pathname;
    const ua = req.headers.get('user-agent') || '';

    if (path === '/legal/privacy') {
        return NextResponse.redirect(new URL('/privacy-policy', url), 308);
    }
    if (path === '/legal/terms') {
        return NextResponse.redirect(new URL('/terms-of-service', url), 308);
    }
    if (path === '/legal/disclaimer') {
        return NextResponse.redirect(new URL('/disclaimer', url), 308);
    }
    if (path === '/terms') {
        return NextResponse.redirect(new URL('/terms-of-service', url), 308);
    }

    // 0. ALLOW GOOGLE SERVICES (Bypass all checks)
    // This is the primary safety rule for Ads compatibility
    if (ALLOWED_BOTS.some(bot => ua.includes(bot))) {
        return NextResponse.next();
    }

    // 1. BLOCK KNOWN SPY TOOLS & BAD BOTS
    if (BAD_BOTS.some(bot => ua.includes(bot))) {
        // Return 403 or just drop
        return new NextResponse(null, { status: 403, statusText: 'Forbidden' });
    }

    // 1.5 DETECT SUSPICIOUS SPY PATTERNS (Headless/Automation)
    // Simple heuristic: If it claims to be Chrome but lacks key headers or has specific headless traits
    const isHeadless = ua.includes('HeadlessChrome') || ua.includes('PhantomJS') || !ua;
    if (isHeadless && !path.startsWith('/api')) {
        // Spy Tool Response Strategy:
        // Don't block hard (they rotate IPs). 
        // Instead, serve a "Challenge" or simplified response (or just 403 for now to be safe)
        // For now, we block to reduce noise.
        return new NextResponse(null, { status: 403, statusText: 'Access Denied' });
    }

    // 1.6 LIGHTWEIGHT SCRAPING FRICTION (Passive)
    // If a request is coming to a public presell route very rapidly from the same IP,
    // we could rate limit it. But for now, we rely on the specific rate-limit module
    // if integrated. Here we just ensure we don't expose headers that help scrapers.

    // 2. ADMIN PROTECTION (NoIndex + Strict Headers)
    if (path.startsWith(ADMIN_PATH) || path.startsWith(API_ADMIN_PATH)) {
        const res = NextResponse.next();
        
        // Anti-Index
        res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        
        // Security
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
            res.headers.set(key, value);
        });
        
        return res;
    }

    // 3. PUBLIC PRESELL PROTECTION
    // Apply security headers but allow indexing (unless specific config says no)
    const res = NextResponse.next();

    // Security Headers (Safe Subset)
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Allow tracking pixels
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // Protect privacy but keep analytics
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    // Asset Protection (Hotlink Prevention - Basic)
    // If accessing images directly, check referrer
    if (PUBLIC_ASSETS.some(asset => path.startsWith(asset))) {
        const referrer = req.headers.get('referer');
        if (referrer && !referrer.includes(url.host) && !referrer.includes('google') && !referrer.includes('facebook')) {
             // Optional: Block hotlinking from random sites
             // return new NextResponse(null, { status: 403 });
             // For now, we just set a header to discourage embedding
             res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
        }
    }

    // 4. PRESELL HARDENING (Anti-Archive)
    // For actual content pages (not assets/api)
    if (!path.startsWith('/api') && !path.startsWith('/_next')) {
        res.headers.set('X-Robots-Tag', 'noarchive, nosnippet'); // Don't cache in Google, don't show snippets
    }

    // 5. REMOVE DEBUG HEADERS
    res.headers.delete('x-powered-by');
    res.headers.delete('server'); // If possible (Vercel might add it back)

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
