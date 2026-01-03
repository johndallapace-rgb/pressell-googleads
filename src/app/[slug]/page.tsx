import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import EditorialTemplate from '@/components/templates/EditorialTemplate';
import StoryTemplate from '@/components/templates/StoryTemplate';
import ComparisonTemplate from '@/components/templates/ComparisonTemplate';
import Script from 'next/script';
import { getCampaignConfig } from '@/lib/campaignConfig';
import LayoutShell from '@/components/LayoutShell';

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
    slug = resolvedParams?.slug;

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
    
    // 2. Resolve Product directly from products object
    // Safe access using ?.
    const product = config.products?.[slug];
    
    // 3. Validate Product Existence & Status
    if (!product || product.status !== 'active') {
      console.log(`[DynamicPage] Product not found or inactive: ${slug}`);
      notFound();
    }

    // 4. Safe Defaults (Defensive Programming)
    const name = product.name ?? 'Product';
    const image = product.image_url ?? '/images/default.svg';
    // Use 'editorial' as safe default if template is missing or invalid
    const templateType = product.template ?? 'editorial'; 

    // A/B Test Logic (Simplified - Client Side Only for Tracking)
    const activeVariantId = 'control';

    // Tracking Script
    const trackingScript = `
      (function() {
        // Track View
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
            }
        });
      })();
    `;

    return (
      <LayoutShell>
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
