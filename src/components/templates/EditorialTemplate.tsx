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

  // Determine Theme based on Vertical
  const getTheme = () => {
    switch (product.vertical) {
      case 'health':
        return {
          pageBg: 'bg-white',
          font: 'font-sans', // Clean sans-serif (Inter/Montserrat equivalent)
          accent: 'bg-blue-50 text-blue-900 border-blue-100',
          headingColor: 'text-gray-900',
          buttonStyle: '!rounded-full shadow-lg', // Rounded buttons
          prosConsGood: 'bg-green-50 border-green-100 text-green-800',
          prosConsBad: 'bg-gray-50 border-gray-100 text-gray-600',
          iconColor: 'text-green-500'
        };
      case 'finance': // Money
        return {
          pageBg: 'bg-gray-50',
          font: 'font-serif', // Robust/Serious (Roboto/Playfair equivalent)
          accent: 'bg-green-50 text-green-900 border-green-200',
          headingColor: 'text-gray-900',
          buttonStyle: '!rounded-md shadow-md border-b-4 border-green-800', // Straighter borders, authority
          prosConsGood: 'bg-white border-green-200 text-green-900 shadow-sm',
          prosConsBad: 'bg-white border-gray-200 text-gray-700 shadow-sm',
          iconColor: 'text-green-700'
        };
      case 'dating': // Relationships
        return {
          pageBg: 'bg-[#FFF5F5]', // Very soft pink/warm background
          font: 'font-sans', // Friendly (Open Sans equivalent)
          accent: 'bg-white text-rose-900 border-rose-100 shadow-sm',
          headingColor: 'text-rose-950',
          buttonStyle: '!rounded-2xl shadow-soft', // Soft borders
          prosConsGood: 'bg-white border-rose-100 text-rose-800 shadow-sm',
          prosConsBad: 'bg-white border-gray-100 text-gray-600 shadow-sm',
          iconColor: 'text-rose-500'
        };
      case 'diy':
        return {
          pageBg: 'bg-white',
          font: 'font-sans',
          accent: 'bg-orange-50 text-orange-900 border-orange-100',
          headingColor: 'text-gray-900',
          buttonStyle: '!rounded-lg shadow-lg',
          prosConsGood: 'bg-green-50 border-green-100 text-green-800',
          prosConsBad: 'bg-gray-50 border-gray-100 text-gray-600',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          pageBg: 'bg-white',
          font: 'font-sans',
          accent: 'bg-gray-50 text-gray-900 border-gray-100',
          headingColor: 'text-gray-900',
          buttonStyle: '!rounded-lg shadow-lg',
          prosConsGood: 'bg-green-50 border-green-100 text-green-800',
          prosConsBad: 'bg-gray-50 border-gray-100 text-gray-600',
          iconColor: 'text-green-500'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`flex flex-col min-h-screen ${theme.font} ${theme.pageBg} text-gray-800 transition-colors duration-300`}>
      
      {/* Content Container */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Hero Section */}
        <ProductHero 
            product={{
                ...product, 
                official_url: ctaUrl, 
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
          <section className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 ${theme.headingColor}`}>{product.whatIs.title || "What You Get"}</h2>
            <div className="prose lg:prose-lg text-gray-700 leading-relaxed">
              {product.whatIs.content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {/* How It Works */}
        {product.howItWorks && (
          <section className={`mb-12 -mx-4 px-6 py-10 md:rounded-2xl border ${theme.accent}`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme.headingColor}`}>{product.howItWorks.title}</h2>
            <div className="prose lg:prose-lg">
              {product.howItWorks.content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {/* Why People Choose It (Pros & Cons) */}
        {product.prosCons && (
          <section className="mb-12">
            <h2 className={`text-2xl font-bold mb-8 text-center ${theme.headingColor}`}>Why People Choose It</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl border ${theme.prosConsGood}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <span className="mr-2">👍</span> The Good
                </h3>
                <ul className="space-y-3">
                  {product.prosCons.pros.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <svg className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${theme.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`p-6 rounded-xl border ${theme.prosConsBad}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <span className="mr-2">⚖️</span> Considerations
                </h3>
                <ul className="space-y-3">
                  {product.prosCons.cons.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Video Review - Centralized Placeholder */}
        <section className="mb-12 bg-black/5 rounded-2xl p-4 md:p-8">
             <h2 className={`text-2xl font-bold mb-8 text-center ${theme.headingColor}`}>Watch the Independent Review</h2>
             {videoObj ? (
                 <VideoReview video={videoObj} disclaimer="This review reflects the personal experience of the user." />
             ) : (
                 <div className="w-full aspect-video bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 shadow-inner">
                     <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <p className="font-medium">Video Review Coming Soon</p>
                 </div>
             )}
        </section>

        {/* Testimonials */}
        <Testimonials testimonials={product.testimonials} productName={product.name} />

        {/* FAQ */}
        {product.faq && product.faq.length > 0 && (
          <section className="mb-12 max-w-3xl mx-auto">
            <h2 className={`text-2xl font-bold mb-8 text-center ${theme.headingColor}`}>Frequently Asked Questions</h2>
            <FAQAccordion items={product.faq} />
          </section>
        )}
        
        {/* Bottom CTA */}
        <div className="text-center mb-12">
          <CTAButton 
            href={ctaUrl} 
            label="Visit Official Website"
            className={`text-xl px-12 py-5 ${theme.buttonStyle}`}
            trackingData={{ product: product.slug, variant: 'bottom' }}
            googleAdsId={product.google_ads_id}
            googleAdsLabel={product.google_ads_label}
          />
          <p className="mt-4 text-sm text-gray-500 opacity-75">
            Secure 256-bit Encrypted Connection
          </p>
        </div>

        {/* Sticky CTA - Visible after 50% scroll */}
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
