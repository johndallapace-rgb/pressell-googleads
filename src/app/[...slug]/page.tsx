import { notFound, redirect } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import { InteractiveCookie } from '@/components/templates/InteractiveCookie';
import { getProduct, debugKV, ensureCanonicalKeys } from '@/lib/config'; // New Vercel KV Import
import LayoutShell from '@/components/LayoutShell';
import { getVerticalFromHost } from '@/lib/host';
import { headers } from 'next/headers';
import { TrackingManager } from '@/components/analytics/TrackingManager';
import { generateExternalTrackId, appendTrackingParams } from '@/lib/tracking';
import { ProductConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Force live data from KV

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParts = resolvedParams?.slug;
  
  if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) return {};

    // HTML/System File Filter
    if (slugParts[0].endsWith('.map')) {
        return {};
    }

    let lang = 'en';
    // Clean slug from extensions
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

  // Use new KV getter with Vertical awareness
  let product: ProductConfig | null = null;

  if (detectedVertical) {
      product = await getProduct(slug, detectedVertical);
  }

  if (!product) {
      // Fallback strategies matching the page logic
      product = await getProduct(`${slug}-${lang}`); // Legacy lang support
      if (!product) {
          product = await getProduct(slug);
      }
  }

  if (!product || product.status !== 'active') return {};
  
  // Canonical Path
  const path = lang === 'en' ? `/${slug}` : `/${lang}/${slug}`;

  return generateSeoMetadata({ product, path }, 'landing');
}

export default async function CatchAllProductPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const slugParts = resolvedParams?.slug; // Array of strings

    console.log('[DEBUG] Slug Parts:', slugParts);

    if (!slugParts || !Array.isArray(slugParts)) {
        notFound();
    }

    // HTML/System File Filter (Runtime)
    // We allow .php now to be cleaned and processed, unless it's a specific system file we want to block?
    // User said "Normalização do Slug: Garanta que o slug seja limpo...".
    // But we might still want to block .map or other weird things.
    if (slugParts[0].endsWith('.map')) {
         return notFound();
    }

    let lang = 'en';
    // Remove .html, .php AND normalize
    let slug = slugParts[0].replace(/\.(php|html)$/, '').trim();

    // REMOVED "index" BLOCKING
    // If slug is "index", we let it proceed to try and find a product named "index" or handle it.
    
    // Detect Locale Strategy
    const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
    
    if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
        // Pattern: /de/amino
        lang = slugParts[0];
        slug = slugParts[1].replace(/\.(php|html)$/, '').trim();
    } else if (slugParts.length === 1) {
        // Pattern: /mitolyn
        slug = slugParts[0].replace(/\.(php|html)$/, '').trim();
    } else {
        // Pattern: /de/amino/extra (too deep) -> 404
        notFound();
    }

    const headerList = await headers();
    const rawHost = headerList.get('host') || 'unknown';
    const forwardedHost = headerList.get('x-forwarded-host');
    const xVertical = headerList.get('x-vertical');
    
    // Priority: X-Forwarded-Host > Host
    const realHost = forwardedHost || rawHost;

    console.log('[ROTA] Raw Host:', rawHost);
    console.log('[ROTA] Forwarded Host:', forwardedHost);
    console.log('[ROTA] X-Vertical:', xVertical);
    console.log('[ROTA] Real Host Used:', realHost);
    console.log('[ROTA] Pathname:', `/${slugParts.join('/')}`);
    
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
    
    // 3. Product Lookup Flow
    let product: ProductConfig | null = null;
    let queryKey = '';

    // A. Try Vertical+Slug (Primary)
    if (detectedVertical) {
         queryKey = `${detectedVertical}:${slug}`;
         console.log(`[LOOKUP] 1. Vertical detected (${detectedVertical}). Querying KV: ${queryKey}`);
         product = await getProduct(slug, detectedVertical);
    }

    // B. Try Slug Only (Fallback)
    if (!product) {
        queryKey = slug;
        console.log(`[LOOKUP] 2. No vertical or not found. Querying KV slug only: ${queryKey}`);
        product = await getProduct(slug);
    }

    // C. Brute Force Search (Rescue)
    if (!product) {
         console.log(`[LOOKUP] 3. Not found. Brute-forcing all verticals for slug: ${slug}`);
         const commonVerticals = ['health', 'diy', 'gadgets', 'finance', 'dating', 'pets', 'other'];
         for (const v of commonVerticals) {
             if (v === detectedVertical) continue;
             
             const tryKey = `${v}:${slug}`;
             console.log(`[LOOKUP] ... trying ${tryKey}`);
             const p = await getProduct(slug, v);
             if (p) {
                 product = p;
                 queryKey = tryKey;
                 console.log(`[LOOKUP] FOUND in ${tryKey}`);
                 break;
             }
         }
    }
    
    // 4. Final Result Handling
    if (product && product.status === 'active') {
        console.log(`[SUCCESS] Product Found!`);
        console.log(`- URL: ${realHost}/${slugParts.join('/')}`);
        console.log(`- KV Key: ${queryKey}`);
        console.log(`- Product Name: ${product.name}`);
        console.log(`- Status: ${product.status}`);

        // --- SELF-HEALING LOGIC ---
        // Ensure canonical keys exist for this product (Repair if missing)
        // Fire-and-forget to not block rendering, but log results
        ensureCanonicalKeys(product, 'Route-CatchAll').catch(err => {
             console.error('[Route-CatchAll] Self-heal failed:', err);
        });
        
    } else {
        console.log(`[MISS/404] Product NOT found or inactive: ${slug}`);
        return notFound();
    }

    // --- Tracking Setup ---
    const externalTrackId = generateExternalTrackId('googleads', lang, slug);
    // Add locale to appendTrackingParams for visual country tracking (aff_sub)
    const trackedAffiliateUrl = appendTrackingParams(product.affiliate_url, externalTrackId, lang);
    
    const productWithLocale = { 
        ...product, 
        activeLocale: lang,
        affiliate_url: trackedAffiliateUrl // Override with tracked URL
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
        
        {/* Centralized Tracking Manager */}
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
