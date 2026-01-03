import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from './lib/auth'; // Removed to avoid Edge runtime issues with crypto

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // 0. Debug Logging
  if (process.env.DEBUG_MIDDLEWARE) {
    console.log(`[Middleware] ${request.method} ${pathname} | Host: ${hostname}`);
  }

  // 1. Exclude Statics (Redundant with matcher but good for safety)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
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

  // 2. Admin Authentication - ABSOLUTE PRIORITY
  // If we are in admin, we DO NOT process verticals.
  if (pathname.startsWith('/admin')) {
    
    // DEBUG: Log admin access
    console.log(`[Middleware] Admin Access: ${pathname} | Host: ${hostname}`);

    // Allow login page unconditionally
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    // If no token, redirect to login
    if (!token) {
        const accept = request.headers.get('accept') || '';
        const userAgent = request.headers.get('user-agent') || '';
        const isBrowser = accept.includes('text/html') && !userAgent.toLowerCase().includes('bot');

        if (isBrowser) {
             console.log(`[Middleware] No Token. Redirecting to /admin/login`);
             return NextResponse.redirect(new URL('/admin/login', request.url));
        } else {
             return NextResponse.rewrite(new URL('/404', request.url));
        }
    }
    
    // STOP HERE. Do not fall through to vertical logic.
    return NextResponse.next();
  }

  // 3. Vertical Logic (Subdomains)
  // Only process if NOT admin (which is handled above and returns)
  
  // HOST CHECK: Explicitly ignore main domain
  if (hostname === 'topproductofficial.com' || hostname === 'www.topproductofficial.com') {
      return NextResponse.next();
  }

  const hostnameParts = hostname.split('.');
  let subdomain = '';
  
  if (!hostname.includes('localhost')) {
     // Check if subdomain exists and is NOT www
     // e.g. [health, topproductofficial, com]
     if (hostnameParts.length >= 3) {
         const sub = hostnameParts[0];
         // Explicitly ignore 'www' as requested
         if (sub !== 'www') {
             subdomain = sub;
         }
     }
  }

  // Rewrite logic only if subdomain is valid and we aren't already there
  if (subdomain && !pathname.startsWith(`/${subdomain}`)) {
       // Rewrite health.domain.com/foo -> /health/foo
       return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
  }
  
  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web manifest)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - sw.js (service worker)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|sw.js|images).*)',
  ],
};
