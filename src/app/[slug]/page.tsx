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
  const { slug } = await params;
  if (!slug) notFound();

  let config;
  try {
    // Securely fetch config
    config = await getCampaignConfig();
  } catch (e) {
      console.error('Critical error loading config:', e);
      notFound();
  }

  // 1. Validate Config Existence
  if (!config) {
    console.error('[DynamicPage] Missing campaign_config');
    notFound();
  }

  // 2. Validate Products Object
  if (!config.products) {
    console.error('[DynamicPage] Missing products object in config');
    notFound();
  }
  
  // 3. Resolve Product directly from products object
  const product = config.products[slug];
  
  // 4. Validate Product Existence
  if (!product) {
    console.log(`[DynamicPage] Product not found in products object: ${slug}`);
    notFound();
  }

  // 5. Validate Product Status
  if (product.status !== 'active') {
    console.log(`[DynamicPage] Product inactive: ${slug}`);
    notFound();
  }

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
}
