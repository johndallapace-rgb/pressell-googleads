import { notFound } from 'next/navigation';
import { getProductWithConfig } from '@/lib/product-helper';
import ProductHero from '@/components/ProductHero';
import FAQAccordion from '@/components/FAQAccordion';
import ReviewList from '@/components/ReviewList';
import StickyCTA from '@/components/StickyCTA';
import VideoReview from '@/components/VideoReview';
import CTAButton from '@/components/CTAButton';
import { generateSeoMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const product = await getProductWithConfig('mitolyn');
  if (!product) return {};
  return generateSeoMetadata({ product, path: '/mitolyn' });
}

export default async function MitolynPage() {
  const product = await getProductWithConfig('mitolyn');
  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProductHero product={product} />

      {/* What Is Mitolyn */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{product.whatIs.title}</h2>
        <div className="prose lg:prose-lg text-gray-700">
          {product.whatIs.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 bg-blue-50 -mx-4 px-4 py-12 md:rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{product.howItWorks.title}</h2>
        <div className="prose lg:prose-lg text-gray-700">
          {product.howItWorks.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Ingredients */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">{product.ingredients.title}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {product.ingredients.items.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-2 text-green-700">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video Review */}
      {product.videoReview && (
        <section className="mb-16">
           <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Watch the Independent Review</h2>
           <VideoReview video={product.videoReview} disclaimer="This review reflects the personal experience of the user." />
        </section>
      )}

      {/* Pros & Cons */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Pros & Cons</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center">
              <span className="mr-2">👍</span> Pros
            </h3>
            <ul className="space-y-3">
              {product.prosCons.pros.map((item, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="font-bold text-lg mb-4 text-red-800 flex items-center">
              <span className="mr-2">👎</span> Cons
            </h3>
            <ul className="space-y-3">
              {product.prosCons.cons.map((item, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Frequently Asked Questions</h2>
        <FAQAccordion items={product.faqs} />
      </section>

      {/* Reviews */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Customer Feedback</h2>
        <ReviewList reviews={product.reviews} />
      </section>
      
      {/* Bottom CTA */}
      <div className="text-center mb-12">
        <CTAButton 
          href={product.officialUrl} 
          label={product.ctaLabel} 
          className="text-xl px-12 py-5"
          trackingData={{ product: product.slug, variant: 'bottom' }}
        />
      </div>

      <StickyCTA 
        href={product.officialUrl} 
        label={product.ctaLabel} 
        trackingData={{ product: product.slug, variant: 'sticky' }}
      />
    </div>
  );
}
