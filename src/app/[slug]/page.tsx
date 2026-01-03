import { notFound } from 'next/navigation';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import EditorialTemplate from '@/components/templates/EditorialTemplate';
import StoryTemplate from '@/components/templates/StoryTemplate';
import ComparisonTemplate from '@/components/templates/ComparisonTemplate';
import Script from 'next/script';
import { getCampaignConfig, getProductBySlug } from '@/lib/campaignConfig';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Allow new slugs that weren't generated at build time

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params;
    if (!slug) return {};
    const config = await getCampaignConfig();
    const product = getProductBySlug(config, slug);
    if (!product || product.status !== 'active') return {};
    return generateSeoMetadata({ product, path: `/${slug}` });
  } catch (error) {
    console.error('[Metadata] Error:', error);
    return {};
  }
}

export default async function DynamicProductPage({ params }: PageProps) {
  try {
    const { slug } = await params;
    if (!slug) notFound();

    // Securely fetch config
    const config = await getCampaignConfig();
    
    // Resolve product
    let product = getProductBySlug(config, slug);
    
    // Status check: only render if active
    if (!product || product.status !== 'active') {
      console.log(`[DynamicPage] Product not found or inactive: ${slug}`);
      notFound();
    }

    // A/B Test Logic (Simplified - Client Side Only for Tracking)
    // We removed server-side cookies/headers to ensure stability in Edge Runtime.
    // Content overrides are disabled for now to prevent hydration mismatches or 500s.
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

    const template = (
      <LayoutShell>
        <Script id="ab-tracking" dangerouslySetInnerHTML={{ __html: trackingScript }} strategy="afterInteractive" />
        {(() => {
          switch (product.template) {
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

    return template;
  } catch (error) {
    console.error('[DynamicPage] Critical Error:', error);
    // Fallback to 404 instead of 500
    notFound();
  }
}
