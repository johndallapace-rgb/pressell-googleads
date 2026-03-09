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
    let slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
    
    const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
    
    if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
        lang = slugParts[0];
        slug = slugParts[1].replace(/\.(php|html)$/, '').trim();
    } else if (slugParts.length === 1) {
        slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
    } else {
        notFound();
    }

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
