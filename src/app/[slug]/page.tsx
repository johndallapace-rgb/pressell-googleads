import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import Script from 'next/script';
import { getCampaignConfig } from '@/lib/campaignConfig';
import LayoutShell from '@/components/LayoutShell';
import { headers } from 'next/headers';
import { getVerticalFromHost } from '@/lib/host';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) return {};
  
  const config = await getCampaignConfig();
  if (!config || !config.products) return {};

  const product = config.products[slug];
  if (!product || product.status !== 'active') return {};
  
  return generateSeoMetadata({ product, path: `/${slug}` });
}

export default async function DynamicProductPage({ params }: PageProps) {
  let slug: string | undefined;

  try {
    const resolvedParams = await params;
    const rawSlug = resolvedParams?.slug;
    
    // Normalize Slug
    slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    // Debug Logs
    const headerList = await headers();
    const host = headerList.get('host') || 'unknown';
    const detectedVertical = getVerticalFromHost(host);
    
    console.log('[DynamicPage] Init', { 
        slug, 
        host, 
        detectedVertical 
    });

    if (!slug) {
      console.error('[DynamicPage] No slug provided');
      notFound();
    }

    // Securely fetch config
    const config = await getCampaignConfig();
    
    // 1. Validate Config Existence
    if (!config || !config.products) {
      console.error('[DynamicPage] Missing config or products');
      notFound();
    }
    
    // Log available keys
    console.log('[DynamicPage] Available Keys:', Object.keys(config.products));

    // 2. Resolve Product directly from products object
    // Safe access using ?.
    // TRY: Exact Slug match first
    let product = config.products?.[slug];
    
    // RETRY: If not found, try to find by iterating keys (case insensitive or partial?)
    // This helps if Edge Config has 'health-mitolyn' but url is 'mitolyn'
    if (!product) {
        const keys = Object.keys(config.products || {});
        // Try to find a key that ends with the slug (e.g. 'mitolyn' matches 'health-mitolyn')
        // OR matches exact slug
        const match = keys.find(k => k === slug || k.endsWith(`-${slug}`));
        if (match) {
            product = config.products[match];
            console.log(`[DynamicPage] Soft match found: ${slug} -> ${match}`);
        }
    }
    
    // Log Product Status
    if (product) {
        console.log('[DynamicPage] Found Product:', {
            slug: product.slug,
            status: product.status,
            vertical: product.vertical,
            name: product.name,
            bulletsCount: product.bullets?.length || 0
        });
    } else {
        console.warn(`[DynamicPage] Product NOT found for slug: ${slug}`);
    }

    // 3. Validate Product Existence & Status
    if (!product || product.status !== 'active') {
      console.log(`[DynamicPage] Product not found or inactive: ${slug} (Status: ${product?.status})`);
      
      // FALLBACK: If vertical is null/undefined (Main Domain) or product not found,
      // instead of 404, we could redirect to Home or show a generic landing.
      // But 404 is technically correct for a missing product URL.
      // However, if the slug is something weird like 'favicon.ico' or 'pressell-googleads...' (from host), ignore.
      
      const ignoredSlugs = ['favicon.ico', 'robots.txt', 'sitemap.xml'];
      if (ignoredSlugs.includes(slug) || slug.startsWith('pressell-googleads')) {
          return notFound();
      }

      // If we are here, it's a real user visiting a dead link.
      notFound();
    }

    // 4. Safe Defaults (Defensive Programming)
    // Most defaults are now handled in normalizeConfig, but we keep this as extra safety
    const name = product.name ?? 'Product';
    // Ensure vertical is set. Prioritize product config, fallback to detected vertical, then default.
    const vertical = product.vertical || detectedVertical || 'general';

    const image = product.image_url ?? '/images/default.svg';
    // Use 'editorial' as safe default if template is missing or invalid
    const templateType = product.template ?? 'editorial'; 

    // A/B Test Logic (Simplified - Client Side Only for Tracking)
    const activeVariantId = 'control';

    // Google Ads Tracking
    const googleAdsId = product.google_ads_id;
    const googleAdsLabel = product.google_ads_label || '';

    // Tracking Script
    const trackingScript = `
      (function() {
        // Track View (Internal)
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                slug: '${slug}', 
                variant: '${activeVariantId}', 
                event: 'view',
                ts: Date.now()
            })
        }).catch(console.error);
        
        // Track Clicks (Delegate)
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.href.includes('/go/${slug}')) {
                 // Internal Tracking
                 fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        slug: '${slug}', 
                        variant: '${activeVariantId}', 
                        event: 'click',
                        ts: Date.now(),
                        dest: 'go'
                    })
                }).catch(console.error);

                // Google Ads Conversion
                if (typeof gtag === 'function' && '${googleAdsId}') {
                    const label = '${googleAdsLabel}';
                    const sendTo = '${googleAdsId}' + (label ? '/' + label : '');
                    
                    gtag('event', 'conversion', {
                        'send_to': sendTo,
                        'event_callback': function() {
                            // Optional callback
                        }
                    });
                }
            }
        });
      })();
    `;

    return (
      <LayoutShell vertical={vertical} supportEmail={product.support_email}>
        {/* Google Ads Global Tag */}
        {googleAdsId && (
            <>
                <Script 
                    src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} 
                    strategy="afterInteractive" 
                />
                <Script id="google-ads-config" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${googleAdsId}');
                    `}
                </Script>
            </>
        )}

        <Script id="ab-tracking" dangerouslySetInnerHTML={{ __html: trackingScript }} strategy="afterInteractive" />
        {(() => {
          switch (templateType) {
              case 'story':
                  return <StoryTemplate product={product} />;
              case 'comparison':
                  return <ComparisonTemplate product={product} />;
              case 'editorial':
              default:
                  return <EditorialTemplate product={product} />;
          }
        })()}
      </LayoutShell>
    );

  } catch (e) {
      // Catch-all for any rendering error
      console.error(`[DynamicPage] Critical error rendering slug ${slug}:`, e);
      notFound();
  }
}
