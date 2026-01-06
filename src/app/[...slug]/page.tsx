import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { StoryTemplate } from '@/components/templates/StoryTemplate';
import { ComparisonTemplate } from '@/components/templates/ComparisonTemplate';
import Script from 'next/script';
import { getCampaignConfig } from '@/lib/campaignConfig';
import LayoutShell from '@/components/LayoutShell';
import { getVerticalFromHost } from '@/lib/host';
import { headers } from 'next/headers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

  const config = await getCampaignConfig();
  if (!config || !config.products) return {};

  // Try localized key first (e.g. "amino-de")
  let product = config.products[`${slug}-${lang}`];
  
  // Fallback to base slug (e.g. "mitolyn")
  if (!product) {
      product = config.products[slug];
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

    console.log('[CatchAllPage] Init', { slug, lang, host });

    const config = await getCampaignConfig();
    
    // 1. Try Localized Key: "amino-de"
    let product = config.products?.[`${slug}-${lang}`];

    // 2. Try Base Key: "mitolyn" (Global Fallback)
    if (!product) {
        product = config.products?.[slug];
        if (product && lang !== 'en') {
             // If we found a global product but requested a locale,
             // we can decide to show it (English content in German URL) or 404.
             // For now, let's show it but maybe log a warning.
             console.log(`[CatchAllPage] Serving global content for ${lang}/${slug}`);
        }
    }

    if (!product || product.status !== 'active') {
      console.log(`[CatchAllPage] Product not found: ${slug} (Lang: ${lang})`);
      // Ignore system files
      if (['favicon.ico', 'robots.txt'].includes(slug)) return notFound();
      return notFound();
    }

    const productWithLocale = { ...product, activeLocale: lang };
    
    // Defaults
    const vertical = product.vertical || detectedVertical || 'general';
    const templateType = product.template || 'editorial';
    const activeVariantId = 'control';
    const googleAdsId = product.google_ads_id;
    const googleAdsLabel = product.google_ads_label || '';

    // Tracking Script
    const trackingScript = `
      (function() {
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                slug: '${slug}', 
                locale: '${lang}',
                variant: '${activeVariantId}', 
                event: 'view',
                ts: Date.now()
            })
        }).catch(console.error);
        
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.href.includes('/go/${slug}')) {
                 fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        slug: '${slug}', 
                        locale: '${lang}',
                        variant: '${activeVariantId}', 
                        event: 'click',
                        ts: Date.now(),
                        dest: 'go'
                    })
                }).catch(console.error);

                if (typeof gtag === 'function' && '${googleAdsId}') {
                    const label = '${googleAdsLabel}';
                    const sendTo = '${googleAdsId}' + (label ? '/' + label : '');
                    gtag('event', 'conversion', { 'send_to': sendTo });
                }
            }
        });
      })();
    `;

    return (
      <LayoutShell vertical={vertical} supportEmail={product.support_email} locale={lang}>
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
