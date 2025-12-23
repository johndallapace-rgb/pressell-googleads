import { notFound } from 'next/navigation';
import { getProductWithConfig } from '@/lib/product-helper';
import ProductHero from '@/components/ProductHero';
import FAQAccordion from '@/components/FAQAccordion';
import ReviewList from '@/components/ReviewList';
import StickyCTA from '@/components/StickyCTA';
import { generateSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

// Force dynamic rendering to fetch latest Edge Config
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) return {};
  const product = await getProductWithConfig(slug);
  const locale = lang as Locale;
  if (!product) return {};
  return generateSeoMetadata({ product, lang: locale }, 'landing');
}

export default async function ProductPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) notFound();
  
  const product = await getProductWithConfig(slug);
  if (!product) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = product.translations[locale] || product.translations['en'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProductHero product={product} lang={locale} />

      <section className="mb-16">
        <div className="flex items-center justify-center mb-8">
           <div className="h-1 w-12 bg-blue-600 rounded"></div>
           <h2 className="text-2xl font-bold mx-4 text-center">Why People Are Talking About {t.name}</h2>
           <div className="h-1 w-12 bg-blue-600 rounded"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
           <div className="prose lg:prose-lg text-gray-700">
              <p className="lead text-xl text-gray-800 font-medium mb-4">
                {t.subHeadline}
              </p>
              <p>
                In a market flooded with quick fixes, {t.name} stands out by focusing on the root cause. 
                Users report feeling a difference in their daily energy levels and overall vitality.
                It&apos;s not just about the scale; it&apos;s about how you feel when you wake up in the morning.
              </p>
              <p>
                The unique blend of ingredients in {t.name} is designed to work synergistically with your body&apos;s natural rhythms.
              </p>
           </div>
           <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h3 className="text-xl font-bold mb-4">Key Benefits Reported</h3>
              <ul className="space-y-4">
                {t.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 font-medium">{bullet}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </section>

      <section className="mb-16 bg-blue-50 -mx-4 px-4 py-16 md:rounded-3xl">
        <h2 className="text-2xl font-bold mb-8 text-center">{dict.common.customerReviews}</h2>
        <ReviewList reviews={t.reviews} />
      </section>

      <section className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{dict.common.faq}</h2>
        <FAQAccordion items={t.faqs} />
        <p className="text-center text-sm text-gray-500 mt-8">
          Always consult with a healthcare professional before starting any new dietary supplement.
        </p>
      </section>
      
      <StickyCTA 
        href={product.officialUrl} 
        label={t.ctaLabel} 
        trackingData={{ product: product.slug, variant: 'default', lang }}
      />
    </div>
  );
}
