import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import { InteractiveCookie } from '@/components/templates/InteractiveCookie';
import { ensureCanonicalKeys } from '@/lib/config';
import { resolveProductBySlug } from '@/lib/product-resolver';
import { logger } from '@/lib/logger';
import LayoutShell from '@/components/LayoutShell';
import { getVerticalFromHost } from '@/lib/host';
import { headers } from 'next/headers';
import { TrackingManager } from '@/components/analytics/TrackingManager';
import { generateExternalTrackId, appendTrackingParams } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_LANGS = ['de', 'fr', 'it', 'es', 'uk'] as const;
const RESERVED_ROUTES = new Set([
  'admin',
  'api',
  'about',
  'contact',
  'privacy-policy',
  'terms',
  'legal',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'sw.js',
  'index',
  'index.html',
  'index.php',
]);

function cleanCandidate(value?: string | null): string {
  if (!value) return '';

  let v = value.split('?')[0].trim();
  v = v.replace(/^\/+/, '').replace(/\/+$/, '');
  v = v.replace(/\.(php|html)$/, '').trim();

  if (!v || RESERVED_ROUTES.has(v)) return '';
  if (v.endsWith('.map')) return '';

  return v;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParts = resolvedParams?.slug;

  if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) {
    return {};
  }

  if (slugParts[0]?.endsWith('.map')) {
    return {};
  }

  let lang = 'en';
  let slug =
    slugParts.length >= 2 && VALID_LANGS.includes(slugParts[0] as any)
      ? slugParts[1]
      : slugParts[0];

  slug = cleanCandidate(slug);

  if (!slug) {
    return {};
  }

  const headerList = await headers();
  const host = headerList.get('host') || 'unknown';
  const verticalHeader = headerList.get('x-vertical');
  let detectedVertical = getVerticalFromHost(host);

  if (verticalHeader) {
    detectedVertical = verticalHeader as any;
  }

  const resolution = await resolveProductBySlug({
    slug,
    vertical: detectedVertical,
    allowInactive: false,
  });

  if (!resolution.found || !resolution.product || resolution.visibility !== 'public') {
    return {};
  }

  const path = lang === 'en' ? `/${slug}` : `/${lang}/${slug}`;
  return generateSeoMetadata({ product: resolution.product, path }, 'landing');
}

export default async function CatchAllProductPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const slugParts = resolvedParams?.slug;
    const headerList = await headers();

    if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) {
      return notFound();
    }

    if (slugParts[0]?.endsWith('.map')) {
      return notFound();
    }

    let lang = 'en';

    if (slugParts.length >= 2 && VALID_LANGS.includes(slugParts[0] as any)) {
      lang = slugParts[0];
    }

    let slug =
      slugParts.length >= 2 && VALID_LANGS.includes(slugParts[0] as any)
        ? slugParts[1]
        : slugParts[0];

    slug = cleanCandidate(slug);

    const nextUrl = headerList.get('next-url');
    const invokePath = headerList.get('x-invoke-path');
    const matchedPath = headerList.get('x-matched-path');

    if (!slug) {
      slug =
        cleanCandidate(nextUrl) ||
        cleanCandidate(invokePath) ||
        cleanCandidate(matchedPath);

      logger.info('public-route', {
        event: 'ROUTE_DEBUG_PATH_INPUT',
        rawParamsSlug: slugParts,
        nextUrl,
        matchedPath,
        invokePath,
        recoveredSlug: slug || null,
        finalSlug: slug || null,
      });
    }

    if (!slug) {
      console.log('[CatchAll] Could not recover a valid slug.');
      return notFound();
    }

    console.log('[DEBUG] Slug Parts:', slugParts);

    const rawHost = headerList.get('host') || 'unknown';
    const forwardedHost = headerList.get('x-forwarded-host');
    const xVertical = headerList.get('x-vertical');
    const realHost = forwardedHost || rawHost;

    logger.info('public-route', {
      event: 'ROUTE_RESOLUTION_START',
      slug,
      rawParamsSlug: slugParts,
      host: rawHost,
      forwardedHost,
      realHost,
      verticalHeader: xVertical,
    });

    let detectedVertical: string | null = xVertical || null;

    if (!detectedVertical) {
      detectedVertical = getVerticalFromHost(realHost);
    }

    if (!detectedVertical && realHost.includes('health')) {
      detectedVertical = 'health';
    }

    console.log('[ROTA] Final Vertical:', detectedVertical || 'none');

    if (RESERVED_ROUTES.has(slug)) {
      console.log(`[CatchAll] Ignored reserved route: ${slug}`);
      return notFound();
    }

    const resolution = await resolveProductBySlug({
      slug,
      vertical: detectedVertical,
      allowInactive: true,
    });

    const { product } = resolution;

    if (!resolution.found || !product) {
      console.log(`[MISS/404] Product NOT found: ${slug}`);

      logger.warn('public-route', {
        event: 'PRODUCT_NOT_FOUND',
        slug,
        attemptedKeys: resolution.attemptedKeys,
        detectedVertical: resolution.detectedVertical,
        host: realHost,
      });

      logger.warn('public-route', {
        event: 'ROUTE_DEBUG_404',
        slug,
        host: realHost,
        detectedVertical,
        attemptedKeys: resolution.attemptedKeys,
        reason: 'unknown',
      });

      return notFound();
    }

    logger.info('public-route', {
      event: 'PRODUCT_LOOKUP_RESULT',
      slug: product.slug,
      found: true,
      source: resolution.source,
      attemptedKeys: resolution.attemptedKeys,
      detectedVertical: resolution.detectedVertical,
      status: product.status,
    });

    if (resolution.visibility !== 'public') {
      console.log(`[BLOCKED] Product found but status is ${product.status}`);

      logger.warn('public-route', {
        event: 'PRODUCT_VISIBILITY_BLOCKED',
        slug: product.slug,
        status: product.status,
        reason: resolution.blockReason,
      });

      logger.warn('public-route', {
        event: 'ROUTE_DEBUG_404',
        slug,
        host: realHost,
        detectedVertical,
        attemptedKeys: resolution.attemptedKeys,
        reason: 'blocked_status',
      });

      return notFound();
    }

    const hasRequiredFields = !!(product.slug && product.vertical && product.status);

    logger.info('public-route', {
      event: 'ROUTE_DEBUG_PRODUCT',
      slug,
      found: true,
      source: resolution.source,
      productSlug: product.slug,
      productVertical: product.vertical,
      productStatus: product.status,
      hasRequiredFields,
    });

    if (!hasRequiredFields) {
      logger.warn('public-route', {
        event: 'ROUTE_DEBUG_404',
        slug,
        host: realHost,
        detectedVertical,
        attemptedKeys: resolution.attemptedKeys,
        reason: 'invalid_product_shape',
      });

      return notFound();
    }

    console.log(`[SUCCESS] Product Found & Active! Source: ${resolution.source}`);

    ensureCanonicalKeys(product, 'Route-CatchAll')
      .then((repaired) => {
        if (repaired) {
          logger.info('self-heal', {
            event: 'SELF_HEAL_SUCCESS',
            slug: product.slug,
            source: 'Route-CatchAll',
          });
        }
      })
      .catch((err) => {
        console.error('[Route-CatchAll] Self-heal failed:', err);
        logger.error('self-heal', {
          event: 'SELF_HEAL_FAILED',
          error: err?.message,
          slug,
        });
      });

    const externalTrackId = generateExternalTrackId('googleads', lang, slug);
    const trackedAffiliateUrl = appendTrackingParams(
      product.affiliate_url,
      externalTrackId,
      lang
    );

    const productWithLocale = {
      ...product,
      activeLocale: lang,
      affiliate_url: trackedAffiliateUrl,
    };

    const vertical = product.vertical || detectedVertical || 'general';
    const templateType = product.template || 'editorial';

    const googleAdsId = product.google_ads_id;
    const googleAdsLabel = product.google_ads_label;
    const metaPixelId = product.meta_pixel_id;

    return (
      <LayoutShell
        vertical={vertical}
        supportEmail={product.support_email}
        locale={lang}
      >
        <TrackingManager
          googleAdsId={googleAdsId}
          googleAdsLabel={googleAdsLabel}
          metaPixelId={metaPixelId}
          slug={slug}
          locale={lang}
        />

        {(() => {
          switch (templateType) {
            case 'story':
              return <StoryTemplate product={productWithLocale} />;
            case 'comparison':
              return <ComparisonTemplate product={productWithLocale} />;
            case 'cookie':
              return <InteractiveCookie product={productWithLocale} />;
            case 'editorial':
            default:
              return <EditorialTemplate product={productWithLocale} />;
          }
        })()}
      </LayoutShell>
    );
  } catch (e) {
    console.error('[CatchAllPage] Error:', e);
    return notFound();
  }
}