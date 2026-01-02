import { notFound } from 'next/navigation';
import { getProduct, ProductConfig } from '@/lib/config';
import { generateSeoMetadata } from '@/lib/seo';
import { PageProps } from '@/types';
import EditorialTemplate from '@/components/templates/EditorialTemplate';
import StoryTemplate from '@/components/templates/StoryTemplate';
import ComparisonTemplate from '@/components/templates/ComparisonTemplate';
import { cookies } from 'next/headers';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) return {};
  const product = await getProduct(slug);
  if (!product || product.status !== 'active') return {};
  return generateSeoMetadata({ product, path: `/${slug}` });
}

export default async function DynamicProductPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  let product = await getProduct(slug);
  
  // Status check: only render if active
  if (!product || product.status !== 'active') {
    notFound();
  }

  // A/B Test Logic
  let activeVariantId = 'control';
  
  if (product.ab_test && product.ab_test.enabled && product.ab_test.variants.length > 0) {
      const cookieStore = await cookies();
      const existingVariant = cookieStore.get(`ab_${slug}`);
      
      if (existingVariant) {
          activeVariantId = existingVariant.value;
      } else {
          // Simple weighted random selection
          const rand = Math.random() * 100;
          let sum = 0;
          for (const variant of product.ab_test.variants) {
              sum += variant.weight;
              if (rand <= sum) {
                  activeVariantId = variant.id;
                  break;
              }
          }
          // Fallback if weights don't sum to 100 or something goes wrong
          if (activeVariantId === 'control' && product.ab_test.variants.length > 0) {
              activeVariantId = product.ab_test.variants[0].id;
          }
      }

      // Apply Variant Overrides
      const selectedVariant = product.ab_test.variants.find(v => v.id === activeVariantId);
      if (selectedVariant) {
          product = {
              ...product,
              headline: selectedVariant.headline || product.headline,
              subheadline: selectedVariant.subheadline || product.subheadline,
              cta_text: selectedVariant.cta_text || product.cta_text
          };
      }
  }

  // Tracking Script
  const trackingScript = `
    (function() {
      // Set Cookie if new
      if (!document.cookie.includes('ab_${slug}=${activeVariantId}')) {
          document.cookie = "ab_${slug}=${activeVariantId}; path=/; max-age=${60 * 60 * 24 * 7}"; // 7 days
      }
      
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
    <>
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
    </>
  );

  return template;
}
