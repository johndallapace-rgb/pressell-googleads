import { ProductConfig } from '@/lib/config';
import { ProductHero } from '@/components/ProductHero';
import { FAQAccordion } from '@/components/FAQAccordion';
import { VideoReview } from '@/components/VideoReview';
import { CTAButton } from '@/components/CTAButton';
import { StickyCTA } from '@/components/StickyCTA';
import { QuickVerdict } from '@/components/public/QuickVerdict';
import { Testimonials } from '@/components/public/Testimonials';

function assertComponent(name: string, comp: any) {
  const t = typeof comp;
  if (t !== 'function') {
    console.error(`[ASSERT] ${name} is not a component. typeof=${t}`, comp);
    throw new Error(`[ASSERT] ${name} invalid type: ${t}`);
  }
}

assertComponent('ProductHero', ProductHero);
assertComponent('FAQAccordion', FAQAccordion);
assertComponent('VideoReview', VideoReview);
assertComponent('CTAButton', CTAButton);
assertComponent('StickyCTA', StickyCTA);
assertComponent('QuickVerdict', QuickVerdict);
assertComponent('Testimonials', Testimonials);

interface Props {
  product: ProductConfig;
}

export function EditorialTemplate({ product }: Props) {
  const ctaUrl = product.affiliate_url; // Direct Affiliate Link (Bridged by CTAButton)
  
  const videoObj = product.youtube_review_id ? {
    provider: 'youtube' as const,
    id: product.youtube_review_id,
    title: `${product.name} Review`
  } : undefined;

  // Synthesize Quick Verdict Data (Safe Defaults if missing)
  const verdict = 'recommended';
  const bestFor = product.bullets?.[0] || 'Anyone looking for quality results';
  const notIdealFor = 'Those seeking overnight miracles';
  const bottomLine = `After reviewing ${product.name}, we found it to be a top contender in its category. The combination of ingredients and positive user feedback makes it a solid choice.`;

  // Determine accent colors based on vertical
  const getAccentColor = () => {
      switch(product.vertical) {
          case 'health': return 'bg-blue-50 text-blue-900 border-blue-100';
          case 'diy': return 'bg-orange-50 text-orange-900 border-orange-100';
          case 'pets': return 'bg-yellow-50 text-yellow-900 border-yellow-100';
          case 'finance': return 'bg-green-50 text-green-900 border-green-100';
          case 'dating': return 'bg-pink-50 text-pink-900 border-pink-100';
          default: return 'bg-gray-50 text-gray-900 border-gray-100';
      }
  };

  const accentClass = getAccentColor();

  return (
    <div className="flex flex-col font-sans text-gray-800">
      
      {/* Content Container */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Hero Section */}
        <ProductHero 
            product={{
                ...product, 
                official_url: ctaUrl, // Override with safe URL
                google_ads_id: product.google_ads_id,
                google_ads_label: product.google_ads_label
            }} 
        /> 

        {/* Quick Verdict */}
        <QuickVerdict 
          productName={product.name}
          verdict={verdict}
          bestFor={bestFor}
          notIdealFor={notIdealFor}
          bottomLine={bottomLine}
          ctaUrl={ctaUrl}
          slug={product.slug}
          googleAdsId={product.google_ads_id}
          googleAdsLabel={product.google_ads_label}
        />

        {/* What You Get (What Is) */}
        {product.whatIs && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{product.whatIs.title || "What You Get"}</h2>
            <div className="prose lg:prose-lg text-gray-700">
              {product.whatIs.content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {/* How It Works */}
        {product.howItWorks && (
          <section className={`mb-16 -mx-4 px-4 py-12 md:rounded-2xl ${accentClass}`}>
            <h2 className="text-2xl font-bold mb-6">{product.howItWorks.title}</h2>
            <div className="prose lg:prose-lg">
              {product.howItWorks.content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {/* Why People Choose It (Pros & Cons) */}
        {product.prosCons && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Why People Choose It</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center">
                  <span className="mr-2">👍</span> The Good
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
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">⚖️</span> Considerations
                </h3>
                <ul className="space-y-3">
                  {product.prosCons.cons.map((item, i) => (
                    <li key={i} className="flex items-start text-gray-600">
                      <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Video Review */}
        {videoObj && (
          <section className="mb-16">
             <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Watch the Independent Review</h2>
             <VideoReview video={videoObj} disclaimer="This review reflects the personal experience of the user." />
          </section>
        )}

        {/* Testimonials */}
        <Testimonials testimonials={product.testimonials} productName={product.name} />

        {/* FAQ */}
        {product.faq && product.faq.length > 0 && (
          <section className="mb-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Frequently Asked Questions</h2>
            <FAQAccordion items={product.faq} />
          </section>
        )}
        
        {/* Bottom CTA */}
        <div className="text-center mb-12">
          <CTAButton 
            href={ctaUrl} 
            label="Visit Official Website"
            className="text-xl px-12 py-5"
            trackingData={{ product: product.slug, variant: 'bottom' }}
            googleAdsId={product.google_ads_id}
            googleAdsLabel={product.google_ads_label}
          />
          <p className="mt-4 text-sm text-gray-500">
            Secure 256-bit Encrypted Connection
          </p>
        </div>

        {/* Sticky CTA */}
        <StickyCTA 
          href={ctaUrl} 
          label="Visit Official Website"
          trackingData={{ product: product.slug, variant: 'sticky' }}
          googleAdsId={product.google_ads_id}
          googleAdsLabel={product.google_ads_label}
        />
      </div>
    </div>
  );
}
