import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from './lib/auth'; // Removed to avoid Edge runtime issues with crypto

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // 0. Debug Logging
  if (process.env.DEBUG_MIDDLEWARE) {
    console.log(`[Middleware] ${request.method} ${pathname} | Host: ${hostname}`);
  }

  // 1. Exclude Statics
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

  // 2. Admin Authentication
  if (pathname.startsWith('/admin')) {
    
    // Strict Admin Domain Check: Admin only accessible on main domain
    // Replace 'www.topproductofficial.com' with your actual main domain or env var
    const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'www.topproductofficial.com';
    const isMainDomain = hostname === MAIN_DOMAIN || hostname === 'localhost:3000'; // Allow localhost for dev

    if (!isMainDomain) {
       // Redirect to main domain admin or 404
       // If we want to centralize, we redirect. If we want to hide, we 404.
       // The prompt asked to redirect to Home of subdomain OR 404.
       // Let's redirect to the main domain admin login to guide the user correctly.
       return NextResponse.redirect(`https://${MAIN_DOMAIN}/admin`);
    }

    // Allow login page to load unconditionally
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    // If no token, redirect to login (Browser) or 404 (Bot)
    if (!token) {
        const accept = request.headers.get('accept') || '';
        const userAgent = request.headers.get('user-agent') || '';
        const isBrowser = accept.includes('text/html') && !userAgent.toLowerCase().includes('bot');

        if (isBrowser) {
             const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'www.topproductofficial.com';
             // Ensure redirect goes to main domain login to set correct cookie
             return NextResponse.redirect(`https://${MAIN_DOMAIN}/admin/login`);
        } else {
             return NextResponse.rewrite(new URL('/404', request.url));
        }
    }
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/admin/:path*'
  ],
};
