import { ProductConfig } from '@/lib/config';
import ProductHero from '@/components/ProductHero';
import FAQAccordion from '@/components/FAQAccordion';
import VideoReview from '@/components/VideoReview';
import CTAButton from '@/components/CTAButton';
import StickyCTA from '@/components/StickyCTA';

interface Props {
  product: ProductConfig;
}

export default function EditorialTemplate({ product }: Props) {
  const ctaUrl = `/go/${product.slug}`;
  
  const videoObj = product.youtube_review_id ? {
    provider: 'youtube' as const,
    id: product.youtube_review_id,
    title: `${product.name} Review`
  } : undefined;

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
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      {/* Topbar / Disclosure */}
      <div className="bg-gray-100 py-2 text-xs text-center text-gray-500 border-b border-gray-200">
        Advertorial Review • {new Date().toLocaleDateString()}
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <ProductHero product={{...product, official_url: ctaUrl}} /> 

        {/* What Is */}
        {product.whatIs && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{product.whatIs.title}</h2>
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

        {/* Video Review */}
        {videoObj && (
          <section className="mb-16">
             <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Watch the Independent Review</h2>
             <VideoReview video={videoObj} disclaimer="This review reflects the personal experience of the user." />
          </section>
        )}

        {/* Pros & Cons */}
        {product.prosCons && (
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
        )}

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
            label={product.cta_text || 'Check Availability'} 
            className="text-xl px-12 py-5"
            trackingData={{ product: product.slug, variant: 'bottom' }}
          />
        </div>

        {/* Sticky CTA */}
        <StickyCTA 
          href={ctaUrl} 
          label={product.cta_text || 'Check Availability'} 
          trackingData={{ product: product.slug, variant: 'sticky' }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p>
            <strong>Affiliate Disclosure:</strong> This content is an advertorial review. We may earn a commission if you click on links and make a purchase. This comes at no extra cost to you.
          </p>
          <p>
            <strong>Medical Disclaimer:</strong> The information provided is for educational purposes only and is not intended to replace professional medical advice. Consult your doctor before starting any new supplement.
          </p>
          <div className="pt-4 flex justify-center space-x-6">
             <a href="/legal/privacy" className="hover:text-white">Privacy Policy</a>
             <a href="/legal/terms" className="hover:text-white">Terms of Use</a>
          </div>
          <p className="pt-4 text-xs text-gray-600">
            © {new Date().getFullYear()} {product.name} Reviews. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
