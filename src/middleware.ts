import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

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

  // 2. Admin Authentication
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      const token = request.cookies.get('admin_token')?.value;
      if (token && (await verifyToken(token))) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      // Optional: Add ?next=...
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Host-based Routing (Pass-through for now)
  // We explicitly allow /[slug] routes (like /mitolyn, /tedswoodworking) to pass through
  // to be handled by the App Router's dynamic route handler (app/[slug]/page.tsx).
  // No rewrites are applied here to avoid confusion or 500 errors.
  
  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
