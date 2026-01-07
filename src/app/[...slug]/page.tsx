import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import { getProduct, debugKV } from '@/lib/config'; // New Vercel KV Import
import LayoutShell from '@/components/LayoutShell';
import { getVerticalFromHost } from '@/lib/host';
import { headers } from 'next/headers';
import { TrackingManager } from '@/components/analytics/TrackingManager';
import { generateExternalTrackId, appendTrackingParams } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Force live data from KV

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParts = resolvedParams?.slug;
  
  if (!slugParts || !Array.isArray(slugParts) || slugParts.length === 0) return {};

  let lang = 'en';
  let slug = slugParts[0];

  const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
  if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
      lang = slugParts[0];
      slug = slugParts[1];
  } else if (slugParts.length === 1) {
      slug = slugParts[0];
  } else {
      return {};
  }

  // Use new KV getter
  let product = await getProduct(`${slug}-${lang}`);
  if (!product) {
      product = await getProduct(slug);
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

    if (!slugParts || !Array.isArray(slugParts)) {
        notFound();
    }

    let lang = 'en';
    let slug = slugParts[0];

    // Detect Locale Strategy
    const validLangs = ['de', 'fr', 'it', 'es', 'uk'];
    
    if (slugParts.length >= 2 && validLangs.includes(slugParts[0])) {
        // Pattern: /de/amino
        lang = slugParts[0];
        slug = slugParts[1];
    } else if (slugParts.length === 1) {
        // Pattern: /mitolyn
        slug = slugParts[0];
    } else {
        // Pattern: /de/amino/extra (too deep) -> 404
        notFound();
    }

    const headerList = await headers();
    const host = headerList.get('host') || 'unknown';
    const detectedVertical = getVerticalFromHost(host);

    console.log('--- DEBUG PRE-SELL ---');
    console.log('Hostname capturado:', host);
    console.log('Slug recebido:', slug);
    console.log('Chave final gerada para o KV:', `${detectedVertical ? detectedVertical + ':' : ''}${slug}`);
    
    const keys = await debugKV();
    console.log('Chaves existentes no banco:', keys);

    // 1. Try Localized Key: "amino-de" (Rare)
    let product = await getProduct(`${slug}-${lang}`, detectedVertical);

    // 2. Try Base Key with Vertical: "health:mitolyn"
    if (!product) {
        product = await getProduct(slug, detectedVertical);
        if (product) {
             console.log(`[CatchAllPage] Found product with vertical prefix: ${detectedVertical}:${slug}`);
        }
    }

    // 3. Fallback: Global Search (No Prefix)
    if (!product) {
        // Try searching for the slug as is (legacy support)
        product = await getProduct(slug); // Tries "mitolyn"
        
        if (product) {
             console.log(`[CatchAllPage] Found product globally (Legacy/No-Prefix): ${slug}`);
        } else {
             // 4. NEW: Brute-force Search for ANY vertical if detectedVertical is missing or mismatched
             // This is CRITICAL for when we access via Main Domain but product is stored as "health:mitolyn"
             console.log(`[CatchAllPage] Deep Search initiated for '${slug}' across all verticals...`);
             
             const commonVerticals = ['health', 'diy', 'gadgets', 'finance', 'dating', 'pets', 'other'];
             for (const v of commonVerticals) {
                 // Skip if we already checked this specific vertical above
                 if (v === detectedVertical) continue;
                 
                 const p = await getProduct(slug, v);
                 if (p) {
                     console.log(`[CatchAllPage] Rescue: Found product in vertical '${v}' (Key: ${v}:${slug})`);
                     product = p;
                     break;
                 }
             }
        }
    }

    if (!product || product.status !== 'active') {
      console.warn(`[CatchAllPage] 404 - Product NOT found. Searched: ${detectedVertical}:${slug} AND ${slug}`);
      // Ignore system files
      if (['favicon.ico', 'robots.txt'].includes(slug)) return notFound();
      return notFound();
    }

    // STRICT VERTICAL ROUTING (Subdomain Enforcement)
    // If accessing via health.domain.com, product MUST be health vertical.
    if (detectedVertical && product.vertical !== detectedVertical) {
         console.warn(`[Routing] Mismatch: Host Vertical (${detectedVertical}) != Product Vertical (${product.vertical})`);
         return notFound(); // Or redirect to main domain? notFound is safer for now to avoid loops.
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
