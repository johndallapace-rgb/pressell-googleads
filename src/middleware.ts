import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server';
import { i18n } from './i18n/i18n-config';
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

  // API routes (except auth) - usually API routes are protected inside the route handler, 
  // but if we have /api/admin/* we might want to protect it here too.
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return;
  }

  // Skip locale check for API routes
  if (pathname.startsWith('/api')) {
    return;
  }

  // Locale Middleware
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = i18n.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    );
  }
}

export const config: MiddlewareConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
