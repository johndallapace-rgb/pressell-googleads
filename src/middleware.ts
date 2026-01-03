import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from './lib/auth'; // Removed to avoid Edge runtime issues with crypto

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // 0. Debug Logging (Toggle via Env Var in Vercel)
  if (process.env.DEBUG_MIDDLEWARE) {
    console.log(`[Middleware] ${request.method} ${pathname} | Host: ${hostname}`);
  }

  // 1. Exclude Statics, APIs, and System Paths from any processing
  // These should pass through directly without auth or rewrite checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static') ||
    [
      '/manifest.json',
      '/favicon.ico',
      '/icon-192.svg',
      '/icon-512.svg',
      '/sw.js',
      '/sitemap.xml',
      '/robots.txt',
      '/offline',
    ].includes(pathname) ||
    pathname.startsWith('/legal/')
  ) {
    return NextResponse.next();
  }

  // 2. Admin Authentication (Security Hardening)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    
    // Allow login page to load (if not authenticated)
    if (pathname === '/admin/login') {
      const token = request.cookies.get('admin_token')?.value;
      // If has token and it MIGHT be valid (light check), redirect to dashboard
      // We do not do full async verification here to keep middleware fast/edge compatible
      if (token) {
         return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    // BOT PROTECTION & STEALTH MODE
    // If no token provided, we want to hide the admin existence from bots/scanners.
    if (!token) {
        // Simple heuristic: If it looks like a browser (HTML request), redirect to login.
        // If it looks like a bot/API client, return 404 to "hide" the route.
        const accept = request.headers.get('accept') || '';
        const userAgent = request.headers.get('user-agent') || '';
        
        const isBrowser = accept.includes('text/html') && !userAgent.toLowerCase().includes('bot');

        if (isBrowser) {
             return NextResponse.redirect(new URL('/admin/login', request.url));
        } else {
             // Return 404 to bots/scanners
             return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    // Note: Full async token verification (verifyToken) is often problematic in Edge Middleware
    // if it relies on crypto libs or complex env vars not available in Edge.
    // For robust security, we trust the cookie presence here but validate deeply in the Layout/Page.
    
    return NextResponse.next();
  }

  // 3. Host-based Routing (Pass-through for now)
  // We explicitly allow /[slug] routes (like /mitolyn, /tedswoodworking) to pass through
  // to be handled by the App Router's dynamic route handler (app/[slug]/page.tsx).
  // No rewrites are applied here to avoid confusion or 500 errors.
  
  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/admin/:path*'
  ],
};
