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

  // 3. Vertical Logic (Subdomains & Locales)
  // Only process if NOT admin (which is handled above and returns)
  
  const hostnameParts = hostname.split('.');
  let subdomain = '';
  
  if (!hostname.includes('localhost')) {
    // Check if subdomain exists and is NOT www
    if (hostnameParts.length >= 3) {
      const sub = hostnameParts[0];
      if (sub !== 'www') {
        subdomain = sub;
      }
    }
  }

  // 4. Folder Strategy: Detect Language/Locale from path
  // health.topproductofficial.com/de/amino -> subdomain=health, locale=de, slug=amino
  
  const pathParts = pathname.split('/').filter(Boolean); // Remove empty
  // Check if first part is a supported locale code
  const supportedLocales = ['de', 'fr', 'it', 'uk', 'es', 'pt'];
  const potentialLocale = pathParts[0];
  
  let locale = 'en'; // Default
  let realSlug = pathname; // Default
  
  if (supportedLocales.includes(potentialLocale)) {
      locale = potentialLocale;
      // The real slug is everything AFTER the locale
      // e.g. /de/amino -> /amino
      // If path is just /de, maybe redirect to home? For now, we assume product slug follows.
      const slugPart = pathParts.slice(1).join('/');
      realSlug = slugPart ? `/${slugPart}` : '/';
  } else {
      // Not a locale, treat as root path slug
      realSlug = pathname;
  }

  // Rewrite Logic
  if (subdomain || locale !== 'en') {
      const url = request.nextUrl.clone();
      
      // If we have a locale in path, we DON'T need to rewrite path anymore
      // because we now have src/app/[lang]/[slug]/page.tsx handling it physically.
      // We just need to pass headers.
      
      if (subdomain && url.pathname === '/') {
          // Subdomain root rewrite (legacy support)
          url.pathname = `/${subdomain}`;
          return NextResponse.rewrite(url);
      }
      
      // For locale paths, we just let them pass through, BUT we inject headers
      // The Next.js router will match [lang]/[slug] automatically.
      
      const response = NextResponse.next();
      
      if (subdomain) response.headers.set('x-vertical', subdomain);
      if (locale) response.headers.set('x-locale', locale);
      
      return response;
  }

  // Pass subdomain as header for normal requests
  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set('x-vertical', subdomain);
  }
  
  return response;
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
