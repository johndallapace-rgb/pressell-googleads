import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ignore assets
  if (
    [
      '/manifest.json',
      '/favicon.ico',
      '/icon-192.svg',
      '/icon-512.svg',
      '/sw.js',
      '/sitemap.xml',
      '/robots.txt',
    ].includes(pathname) ||
    pathname.startsWith('/_next')
  ) {
    return;
  }

  // Auth Middleware for /admin
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      const token = request.cookies.get('admin_token')?.value;
      if (token && (await verifyToken(token))) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return;
    }

    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return;
  }

  // API routes protection
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return;
  }

  // No locale middleware needed anymore
}

export const config: MiddlewareConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
