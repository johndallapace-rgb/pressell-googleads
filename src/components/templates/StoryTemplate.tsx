import { ProductConfig } from '@/lib/config';
import CTAButton from '@/components/CTAButton';
import StickyCTA from '@/components/StickyCTA';

interface Props {
  product: ProductConfig;
}

export default function StoryTemplate({ product }: Props) {
  const ctaUrl = `/go/${product.slug}`;

  return (
    <div className="min-h-screen flex flex-col font-serif text-gray-800 bg-[#fdfbf7]">
      {/* Topbar */}
      <div className="bg-white py-2 text-xs text-center text-gray-500 border-b border-gray-200 font-sans">
        Sponsored Story • {new Date().toLocaleDateString()}
      </div>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
        <article>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 font-sans">
                {product.headline}
            </h1>
            <p className="text-xl text-gray-600 mb-8 italic font-sans border-l-4 border-gray-300 pl-4">
                {product.subheadline}
            </p>

            <div className="flex items-center mb-10 text-sm text-gray-500 font-sans">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div>
                    <p className="font-bold text-gray-900">By Editorial Team</p>
                    <p>Updated {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Content Body - Simulated Story Flow */}
            <div className="prose prose-lg prose-gray max-w-none mb-12">
                <p className="lead">
                    It started like any other day, but little did I know that finding {product.name} would change everything.
                </p>
                
                {product.image_url && (
                    <div className="my-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full rounded-lg shadow-md"
                            onError={(e) => { e.currentTarget.src = '/images/placeholder.svg'; }}
                        />
                        <p className="text-center text-sm text-gray-500 mt-2 italic font-sans">The product that changed my perspective.</p>
                    </div>
                )}

                {product.whatIs && (
                    <>
                        <h2 className="font-sans">What I Discovered</h2>
                        {product.whatIs.content.map((p, i) => <p key={i}>{p}</p>)}
                    </>
                )}

                {product.howItWorks && (
                    <>
                        <h2 className="font-sans">How It Actually Works</h2>
                        {product.howItWorks.content.map((p, i) => <p key={i}>{p}</p>)}
                    </>
                )}

                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 my-10 not-prose">
                    <h3 className="text-xl font-bold mb-4 font-sans">Why I Recommend It:</h3>
                    <ul className="space-y-2">
                        {product.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-green-500 mr-2 font-bold">✓</span>
                                {bullet}
                            </li>
                        ))}
                    </ul>
                </div>

                <p>
                    If you are on the fence, I highly recommend giving {product.name} a try. 
                    They have a guarantee, so there is really no risk involved.
                </p>
            </div>

            <div className="text-center mb-16 font-sans">
                <CTAButton 
                    href={ctaUrl} 
                    label={product.cta_text || 'Check Availability'} 
                    className="text-xl px-12 py-4 shadow-lg hover:shadow-xl transition-shadow"
                    trackingData={{ product: product.slug, variant: 'story_bottom' }}
                />
            </div>
        </article>
      </main>

      <StickyCTA 
          href={ctaUrl} 
          label={product.cta_text || 'Check Availability'} 
          trackingData={{ product: product.slug, variant: 'sticky' }}
        />

      <footer className="bg-gray-100 text-gray-500 py-12 text-sm font-sans border-t">
        <div className="container mx-auto px-4 text-center space-y-4">
            <p>Advertorial Story.</p>
            <div className="flex justify-center space-x-6">
             <a href="/legal/privacy" className="hover:text-gray-900">Privacy</a>
             <a href="/legal/terms" className="hover:text-gray-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
