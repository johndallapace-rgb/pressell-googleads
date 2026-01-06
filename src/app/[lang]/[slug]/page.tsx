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
  const { slug, lang } = await params;
  if (!slug) return {};
  
  const config = await getCampaignConfig();
  if (!config || !config.products) return {};

  // Construct localized slug: "amino-de"
  const localizedSlug = `${slug}-${lang}`;
  
  // Try localized first, then fall back to base slug
  let product = config.products[localizedSlug] || config.products[slug];
  
  if (!product || product.status !== 'active') return {};
  
  // SEO Path: /de/amino
  const path = `/${lang}/${slug}`;

  return generateSeoMetadata({ product, path }, 'landing');
}

export default async function LocalizedProductPage({ params }: PageProps) {
  let slug: string | undefined;
  let lang: string | undefined;

  try {
    const resolvedParams = await params;
    slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug[0] : resolvedParams?.slug;
    lang = Array.isArray(resolvedParams?.lang) ? resolvedParams.lang[0] : resolvedParams?.lang;

    if (!slug || !lang) {
      notFound();
    }

    const headerList = await headers();
    const host = headerList.get('host') || 'unknown';
    const detectedVertical = getVerticalFromHost(host);

    console.log('[LocalizedPage] Init', { slug, lang, host });

    const config = await getCampaignConfig();
    
    // Logic: Look for "amino-de"
    const lookupKey = `${slug}-${lang}`;
    let product = config.products?.[lookupKey];

    // Fallback: Check if the base slug exists and maybe we adapt it dynamically?
    // But per current architecture, we generated "amino-de" specifically.
    if (!product) {
        // Try finding by base slug just in case
        product = config.products?.[slug];
        if (product) {
            console.log(`[LocalizedPage] Exact match not found for ${lookupKey}, using base ${slug}`);
        }
    }

    if (!product || product.status !== 'active') {
      console.log(`[LocalizedPage] Product not found: ${lookupKey}`);
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
      console.error(`[LocalizedPage] Error:`, e);
      notFound();
  }
}
