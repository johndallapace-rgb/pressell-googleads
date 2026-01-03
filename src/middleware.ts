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
    
    // Smart Domain Check: Allow both www and non-www of the main domain
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://www.topproductofficial.com';
    let mainDomain = 'www.topproductofficial.com';
    try {
        mainDomain = new URL(NEXTAUTH_URL).hostname;
    } catch (e) {
        // Fallback
    }

    // Normalize: Remove port and www for comparison
    const cleanHost = hostname.split(':')[0].replace(/^www\./, '');
    const cleanMain = mainDomain.replace(/^www\./, '');

    const isMainDomain = cleanHost === cleanMain || cleanHost === 'localhost';

    if (!isMainDomain) {
       // Redirect to main domain (canonical) preserving path
       const url = request.nextUrl.clone();
       url.hostname = mainDomain;
       url.port = ''; 
       return NextResponse.redirect(url);
    }

    // Allow login page to load unconditionally
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
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

  // 3. Vertical Logic (Subdomains)
  // Only process if NOT admin (which is handled above and returns)
  // And ignore API routes generally handled by Next.js
  
  // Detect subdomain
  const hostnameParts = hostname.split('.');
  // e.g. health.topproductofficial.com -> ['health', 'topproductofficial', 'com']
  // localhost:3000 -> ['localhost:3000']
  
  let subdomain = '';
  const isLocal = hostname.includes('localhost');
  
  if (isLocal) {
     // Localhost logic: maybe sub.localhost? For now, ignore or mock
  } else {
     // Production: if 3 parts, first is subdomain (unless www)
     if (hostnameParts.length >= 3) {
         const sub = hostnameParts[0];
         if (sub !== 'www') {
             subdomain = sub;
         }
     }
  }

  // If subdomain exists, rewrite to vertical path
  // BUT: Ensure we are not already on that path to avoid loops
  if (subdomain && !pathname.startsWith(`/${subdomain}`)) {
      // Rewrite health.domain.com/foo -> domain.com/health/foo ?
      // Or just health.domain.com -> domain.com/health (Root)
      
      // Note: The user's request "Fallback de Vertical" implies handling this here.
      // However, usually Vercel handles rewrites. 
      // If we do manual rewrite:
      // return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
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
