import { notFound, redirect } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import { InteractiveCookie } from '@/components/templates/InteractiveCookie';
import { ensureCanonicalKeys } from '@/lib/config'; 
import { resolveProductBySlug } from '@/lib/product-resolver'; // NEW Universal Resolver
import { logger } from '@/lib/logger'; 
import LayoutShell from '@/components/LayoutShell';
import { getVerticalFromHost } from '@/lib/host';
import { headers } from 'next/headers';
import { TrackingManager } from '@/components/analytics/TrackingManager';
import { generateExternalTrackId, appendTrackingParams } from '@/lib/tracking';
import { ProductConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParts = resolvedParams?.slug;
  
  if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) return {};

    // HTML/System File Filter
    if (slugParts[0].endsWith('.map')) {
        return {};
    }

    let lang = 'en';
    let slug = slugParts[0].replace(/\.(php|html)$/, '').trim();

  const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
  if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
      lang = slugParts[0];
      slug = slugParts[1].replace(/\.(php|html)$/, '').trim();
  } else if (slugParts.length === 1) {
      slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
  } else {
      return {};
  }

  // Ignore index/index.html slugs for metadata too
  if (slug === 'index' || slug === 'index.html') {
      return {};
  }

  // Get Vertical Context for Metadata
  const headerList = await headers();
  const host = headerList.get('host') || 'unknown';
  const verticalHeader = headerList.get('x-vertical');
  let detectedVertical = getVerticalFromHost(host);

  if (verticalHeader) {
      detectedVertical = verticalHeader as any;
  }

  // Use Universal Resolver
  const resolution = await resolveProductBySlug({ 
      slug, 
      vertical: detectedVertical,
      allowInactive: false 
  });

  if (!resolution.found || !resolution.product || resolution.visibility !== 'public') return {};
  
  const path = lang === 'en' ? `/${slug}` : `/${lang}/${slug}`;
  return generateSeoMetadata({ product: resolution.product, path }, 'landing');
}

export default async function CatchAllProductPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const slugParts = resolvedParams?.slug; 

    console.log('[DEBUG] Slug Parts:', slugParts);

    if (!slugParts || !Array.isArray(slugParts)) {
        notFound();
    }

    if (slugParts[0].endsWith('.map')) {
         return notFound();
    }

    let lang = 'en';
    // CLEAN SLUG from slugParts[0]
    let slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
    
    // BUT WAIT: Next.js catch-all might have nxtPsSlug or other params if rewritten?
    // Actually, we should just rely on slugParts.
    
    const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
    
    if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
        lang = slugParts[0];
        slug = slugParts[1].replace(/\.(php|html)$/, '').trim();
    } else if (slugParts.length === 1) {
        slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
    } else {
        // Pattern: /de/amino/extra (too deep) -> 404
        // Or weird params
        notFound();
    }

    // EDGE CASE: If slug becomes "index" or "index.html" due to some weird rewriting
    // But user wants "mitolyn..."
    // In Vercel, if the URL is /mitolyn, slugParts should be ['mitolyn']
    // If nxtPsSlug appears, it's usually an internal header/param, not in params.slug?
    // Wait, the user says "request arrives with search param: nxtPsSlug=index.html".
    // params.slug comes from the PATH.
    // If the path is /mitolyn, params.slug is ['mitolyn'].
    // If Vercel rewrites internally to index.html, params.slug might be weird?
    // BUT the user says: "Because of this the resolver tries to load product 'index.html'".
    // This implies slug variable IS 'index.html'.
    
    // FIX: If slug is 'index' or 'index.html', AND we have a query param telling us the real slug?
    // No, the user says "Ensure the slug is derived correctly from params.slug and ignore nxtPsSlug=index.html".
    // This implies that MAYBE params.slug is CORRECT ('mitolyn') but something else is interfering?
    // OR params.slug IS 'index.html' wrongly?
    
    // Re-reading: "In production on Vercel the request arrives with search param: nxtPsSlug=index.html ... resolver tries to load product index.html"
    // This suggests that `slug` variable is ending up as `index.html`.
    // Why? Maybe `slugParts` is `['index.html']`?
    // If so, we should ignore it if there's a better source? 
    // BUT the user says "Only use nxtPsSlug if params.slug is empty".
    
    // Let's look at the instructions again:
    // "If params.slug exists, join it to form the slug."
    // "Ignore nxtPsSlug when its value is index.html".
    
    // It seems the user suspects that sometimes we might be reading from query params?
    // But `params` here is the Route Params from `[...slug]`.
    // If I request `/mitolyn`, `params.slug` IS `['mitolyn']`.
    // If I request `/`, `params.slug` is undefined (handled by page.tsx in root, not here).
    
    // HYPOTHESIS: The user might be seeing a case where `params.slug` is EMPTY or weird, and we might be falling back to something?
    // OR, Vercel is rewriting `/mitolyn` -> `/index.html?nxtPsSlug=mitolyn` ??
    // If so, `slugParts` would be `['index.html']`?
    // If `slug` is `index` or `index.html`, we should treat it as invalid/ignored IF we can find the real slug elsewhere?
    
    // Actually, `CatchAllProductPage` receives `params`.
    // If `params.slug` is `['mitolyn']`, then `slug` becomes `mitolyn`.
    // The code I see does `slug = slugParts[0]...`.
    // So if it resolves to `index.html`, then `slugParts[0]` MUST be `index.html`.
    
    // User constraint: "Only use nxtPsSlug if params.slug is empty AND it is not index.html".
    // But we are in `[...slug]`, so `params.slug` is never empty (it matches 1+ segments).
    
    // WAIT. If `params.slug` is `['index.html']` (maybe due to a rewrite rule in vercel.json or middleware?),
    // then we definitely don't want to look up a product named "index".
    
    // ----------------------------------------------------------------------
    // SLUG NORMALIZATION & RECOVERY
    // ----------------------------------------------------------------------
    const headerList = await headers();
    
    // 1. Initial Extraction
    let slug = slugParts[0];
    
    // 2. Recovery Strategy (if slug is bad)
    const isBadSlug = !slug || slug === 'index.html' || slug === 'index' || slug === '/';
    
    if (isBadSlug) {
        // Try to recover from headers
        const nextUrl = headerList.get('next-url'); // e.g. /mitolyn-metabolism-boost
        const invokePath = headerList.get('x-invoke-path');
        const matchedPath = headerList.get('x-matched-path');
        
        // Prefer next-url as it's usually the original requested path
        const candidatePath = nextUrl || invokePath || matchedPath;
        
        if (candidatePath) {
            // Remove leading slash and query params
            // Example: /mitolyn-metabolism-boost?foo=bar -> mitolyn-metabolism-boost
            let cleanPath = candidatePath.split('?')[0];
            cleanPath = cleanPath.replace(/^\//, ''); // Remove leading slash
            
            // Safety check: don't recover to "index"
            if (cleanPath && cleanPath !== 'index' && cleanPath !== 'index.html') {
                slug = cleanPath;
                console.log(`[CatchAll] Recovered slug from headers: ${slug}`);
            }
        }
    }
    
    // 3. Final Cleaning
    slug = slug.replace(/\.(php|html)$/, '').trim();
    slug = slug.replace(/\/$/, '');

    // 4. Debug Log
    logger.info('public-route', {
        event: 'ROUTE_DEBUG_PATH_INPUT',
        rawParamsSlug: slugParts,
        nextUrl: headerList.get('next-url'),
        matchedPath: headerList.get('x-matched-path'),
        invokePath: headerList.get('x-invoke-path'),
        recoveredSlug: slug !== slugParts[0] ? slug : undefined,
        finalSlug: slug
    });

    // 5. Final Block
    if (slug === 'index' || slug === 'index.html' || !slug || slug === '/') {
         console.log('[CatchAll] Blocked "index" or empty slug.');
         return notFound();
    }
    
    // The user says "Ensure the slug is derived correctly from params.slug".
    // The current code ALREADY does `slug = slugParts[0]...`.
    // So if `slug` is correct (e.g. `mitolyn`), we are good.
    // If `slug` is `index.html`, we block it.
    
    // What if `nxtPsSlug` contains the REAL slug?
    // The user mentioned "Ignore nxtPsSlug when its value is index.html".
    // This implies we MIGHT be reading `searchParams`? 
    // The current code DOES NOT read `searchParams`.
    
    // So if the current code works for `/mitolyn` (slug='mitolyn'), why does the user say "resolver tries to load product index.html"?
    // Maybe in their production env, `slugParts` IS `['index.html']` for some reason?
    // If so, my block above fixes it.
    
    // But the user also said: "Only use nxtPsSlug if params.slug is empty".
    // In `[...slug]`, `params.slug` cannot be empty.
    
    // Perhaps the user is confused about where the slug comes from, OR they have a custom server?
    // But strictly following the goal: "Ensure the slug is derived correctly from params.slug".
    // My code does that.
    
    // "Request: .../mitolyn... Should resolve slug: mitolyn... instead of index.html".
    // If `params.slug` gives `mitolyn`, we are fine.
    // If `params.slug` gives `index.html` (wrongly), we block it.
    
    // I will simply ensure we stick to `params.slug` and explicitly IGNORE/BLOCK `index` artifacts.
    
    // Also, checking `generateMetadata` as well.


    const headerList = await headers();
    const rawHost = headerList.get('host') || 'unknown';
    const forwardedHost = headerList.get('x-forwarded-host');
    const xVertical = headerList.get('x-vertical');
    
    const realHost = forwardedHost || rawHost;

    logger.info('public-route', {
        event: 'ROUTE_RESOLUTION_START',
        slug: slugParts.join('/'),
        host: rawHost,
        forwardedHost: forwardedHost,
        realHost: realHost,
        verticalHeader: xVertical,
    });
    
    // 1. Vertical Detection Pipeline
    let detectedVertical: string | null = xVertical || null;

    if (!detectedVertical) {
        detectedVertical = getVerticalFromHost(realHost);
    }

    if (!detectedVertical && realHost.includes('health')) {
        detectedVertical = 'health';
    }

    console.log('[ROTA] Final Vertical:', detectedVertical || 'none');
    
    // 2. Reserved Routes Protection
    const reservedRoutes = [
        'admin', 'api', 'about', 'contact', 'privacy-policy', 'terms', 'legal',
        'robots.txt', 'sitemap.xml', 'favicon.ico', 'sw.js', 'index', 'index.html', 'index.php'
    ];
    
    if (reservedRoutes.includes(slugParts[0]) || reservedRoutes.includes(slug)) {
        console.log(`[CatchAll] Ignored reserved/system route: ${slug}`);
        return notFound();
    }
    
    // 3. UNIVERSAL RESOLUTION
    const resolution = await resolveProductBySlug({
        slug,
        vertical: detectedVertical,
        allowInactive: true // We resolve first, then check visibility
    });

    const { product } = resolution;

    // 4. Result Handling
    if (resolution.found && product) {
        // Log Success
        logger.info('public-route', {
            event: 'PRODUCT_LOOKUP_RESULT',
            slug: product.slug,
            found: true,
            source: resolution.source,
            attemptedKeys: resolution.attemptedKeys,
            detectedVertical: resolution.detectedVertical,
            status: product.status
        });

        // Visibility Check
        if (resolution.visibility !== 'public') {
             console.log(`[BLOCKED] Product found but status is ${product.status}`);
             logger.warn('public-route', {
                 event: 'PRODUCT_VISIBILITY_BLOCKED',
                 slug: product.slug,
                 status: product.status,
                 reason: resolution.blockReason
             });
             
             // DEBUG 404
             logger.warn('public-route', {
                event: 'ROUTE_DEBUG_404',
                slug,
                host: realHost,
                detectedVertical,
                attemptedKeys: resolution.attemptedKeys,
                reason: 'blocked_status'
             });

             return notFound(); 
        }

        // Validate Shape (Task 4)
        const hasRequiredFields = !!(product.slug && product.vertical && product.status);
        
        logger.info('public-route', {
            event: 'ROUTE_DEBUG_PRODUCT',
            slug,
            found: true,
            source: resolution.source,
            productSlug: product.slug,
            productVertical: product.vertical,
            productStatus: product.status,
            hasRequiredFields
        });

        if (!hasRequiredFields) {
             logger.warn('public-route', {
                event: 'ROUTE_DEBUG_404',
                slug,
                host: realHost,
                detectedVertical,
                attemptedKeys: resolution.attemptedKeys,
                reason: 'invalid_product_shape'
             });
             return notFound();
        }

        // Success Path
        console.log(`[SUCCESS] Product Found & Active! Source: ${resolution.source}`);

        // --- SELF-HEALING LOGIC ---
        // Ensure canonical keys exist for this product (Repair if missing)
        // Fire-and-forget to not block rendering, but log results
        ensureCanonicalKeys(product, 'Route-CatchAll').then(repaired => {
             if (repaired) {
                 logger.info('self-heal', { event: 'SELF_HEAL_SUCCESS', slug: product!.slug, source: 'Route-CatchAll' });
             }
        }).catch(err => {
             console.error('[Route-CatchAll] Self-heal failed:', err);
             logger.error('self-heal', { event: 'SELF_HEAL_FAILED', error: err?.message, slug });
        });
        
    } else {
        // TRULY MISSING
        console.log(`[MISS/404] Product NOT found: ${slug}`);
        logger.warn('public-route', {
            event: 'PRODUCT_NOT_FOUND',
            slug,
            attemptedKeys: resolution.attemptedKeys,
            detectedVertical: resolution.detectedVertical,
            host: realHost
        });

        logger.warn('public-route', {
            event: 'ROUTE_DEBUG_404',
            slug,
            host: realHost,
            detectedVertical,
            attemptedKeys: resolution.attemptedKeys,
            reason: 'unknown' // or detailed if we knew more
        });

        return notFound();
    }

    // --- Tracking Setup ---
    const externalTrackId = generateExternalTrackId('googleads', lang, slug);
    const trackedAffiliateUrl = appendTrackingParams(product.affiliate_url, externalTrackId, lang);
    
    const productWithLocale = { 
        ...product, 
        activeLocale: lang,
        affiliate_url: trackedAffiliateUrl 
    };
    
    // Defaults
    const vertical = product.vertical || detectedVertical || 'general';
    const templateType = product.template || 'editorial';
    
    // Tracking IDs
    const googleAdsId = product.google_ads_id;
    const googleAdsLabel = product.google_ads_label;
    const metaPixelId = product.meta_pixel_id; 

    return (
      <LayoutShell vertical={vertical} supportEmail={product.support_email} locale={lang}>
        
        <TrackingManager 
            googleAdsId={googleAdsId}
            googleAdsLabel={googleAdsLabel}
            metaPixelId={metaPixelId}
            slug={slug}
            locale={lang}
        />

        {(() => {
          switch (templateType) {
              case 'story': return <StoryTemplate product={productWithLocale} />;
              case 'comparison': return <ComparisonTemplate product={productWithLocale} />;
              case 'cookie': return <InteractiveCookie product={productWithLocale} />;
              case 'editorial': default: return <EditorialTemplate product={productWithLocale} />;
          }
        })()}
      </LayoutShell>
    );

  } catch (e) {
      console.error(`[CatchAllPage] Error:`, e);
      notFound();
  }
}
