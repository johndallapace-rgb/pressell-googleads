'use client';

import { ProductConfig } from '@/lib/config';
import { CTAButton } from '@/components/CTAButton';
import { StickyCTA } from '@/components/StickyCTA';
import { SafeImage } from '@/components/SafeImage';
import { useState, useEffect } from 'react';

interface Props {
  product: ProductConfig;
}

export function StoryTemplate({ product }: Props) {
  const ctaUrl = product.affiliate_url; // Direct Affiliate Link (Bridged by CTAButton)
  const [iframeAllowed, setIframeAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIframe = async () => {
        const targetUrl = product.affiliate_url || product.official_url;
        if (!targetUrl) {
            setIframeAllowed(false);
            return;
        }
        try {
            const res = await fetch(`/api/utils/check-iframe?url=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            setIframeAllowed(data.canLoad);
        } catch {
            setIframeAllowed(false);
        }
    };
    checkIframe();
  }, [product.affiliate_url, product.official_url]);

  return (
    <div className="min-h-screen flex flex-col font-serif text-gray-800 relative bg-[#fdfbf7]">
      <style>{`
        @keyframes pulse-scale {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .animate-pulse-scale {
            animation: pulse-scale 2s infinite ease-in-out;
        }
      `}</style>
      
      {/* Background Dynamic Iframe/Image with Blur */}
      <div className="fixed inset-0 z-0">
          {/* STABILITY PRIORITY: Sales Page Preview > Image > Iframe */}
          {product.sales_page_image_url ? (
            <div 
                className="absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${product.sales_page_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center', // ALIGNMENT: Top Center
                    filter: 'blur(2px)',
                    zIndex: 0
                }}
            />
          ) : (
             // Fallback to Iframe
             (iframeAllowed === true && (product.affiliate_url || product.official_url)) ? (
                 <iframe 
                    src={product.affiliate_url || product.official_url}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 pointer-events-none"
                    style={{ filter: 'blur(2px)', zIndex: 0 }}
                    tabIndex={-1}
                    aria-hidden="true"
                    sandbox="allow-scripts allow-same-origin"
                 />
             ) : (
                 // REMOVED: Isolated Bottle Fallback
                 null
             )
          )}

          {/* Light Overlay Mask for Readability */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-none" style={{ zIndex: 2 }} />
      </div>

      {/* Topbar */}
      <div className="relative z-10 bg-white/90 py-3 px-6 flex justify-between items-center text-xs text-gray-500 border-b border-gray-200 font-sans backdrop-blur-sm shadow-sm">
        <div className="font-bold text-gray-800 text-lg tracking-tight">TopProductOfficial™</div>
        <div className="hidden md:flex gap-4">
            <a href="/legal/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="/legal/terms" className="hover:text-gray-900 transition-colors">Terms of Use</a>
            <a href="/legal/disclaimer" className="hover:text-gray-900 transition-colors">Disclaimer</a>
        </div>
      </div>

      <main className="relative z-10 flex-grow container mx-auto px-4 py-8 max-w-3xl mb-12">
        <article className="bg-white/90 p-8 md:p-12 rounded-2xl shadow-xl backdrop-blur-md border border-white/50">
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
                    <div className="my-8 flex justify-center">
                        <div className="w-full max-w-[450px]">
                            <SafeImage 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full rounded-lg shadow-md"
                            />
                            <p className="text-center text-sm text-gray-500 mt-2 italic font-sans">The product that changed my perspective.</p>
                        </div>
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

            <div className="text-center mb-8 font-sans">
                <CTAButton 
                    href={ctaUrl} 
                    label={product.cta_text || 'Check Availability'} 
                    className="text-xl px-12 py-4 shadow-lg hover:shadow-xl transition-all animate-pulse-scale"
                    trackingData={{ product: product.slug, variant: 'story_bottom' }}
                    googleAdsId={product.google_ads_id}
                    googleAdsLabel={product.google_ads_label}
                />
            </div>
        </article>
      </main>

      <StickyCTA 
          href={ctaUrl} 
          label={product.cta_text || 'Check Availability'} 
          trackingData={{ product: product.slug, variant: 'sticky' }}
          googleAdsId={product.google_ads_id}
          googleAdsLabel={product.google_ads_label}
          className="animate-pulse-scale"
        />

      <footer className="bg-gray-100 text-gray-500 py-12 text-sm font-sans border-t relative z-10">
        <div className="container mx-auto px-4 text-center space-y-4">
            <div className="mb-4">
                <span className="font-bold text-gray-700">TopProductOfficial™</span>
                <p className="text-xs mt-1">Providing honest reviews since 2024.</p>
            </div>
            
            <p className="text-xs max-w-2xl mx-auto opacity-70">
                Disclaimer: The content of this site is for informational purposes only. It is not intended as medical advice. 
                Always consult with a physician before starting any new supplement regimen.
            </p>

            <div className="flex justify-center space-x-6 pt-4 border-t border-gray-200 mt-4">
             <a href="/legal/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
             <a href="/legal/terms" className="hover:text-gray-900 transition-colors">Terms of Use</a>
             <a href="/legal/disclaimer" className="hover:text-gray-900 transition-colors">Disclaimer</a>
             <a href={`mailto:${product.support_email || 'support@topproductofficial.com'}`} className="hover:text-gray-900 transition-colors">Contact Support</a>
          </div>
          <p className="text-xs mt-6 opacity-50">© {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
