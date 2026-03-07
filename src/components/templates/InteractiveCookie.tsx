'use client';

import { ProductConfig } from '@/lib/config';
import { CTAButton } from '@/components/CTAButton';
import { useState, useEffect } from 'react';

interface Props {
  product: ProductConfig;
}

export function InteractiveCookie({ product }: Props) {
  const ctaUrl = product.affiliate_url;
  const [isVisible, setIsVisible] = useState(false);
  const [iframeAllowed, setIframeAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Animation Entrance
    const timer = setTimeout(() => setIsVisible(true), 100);

    // 2. Smart Iframe Check
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

    return () => clearTimeout(timer);
  }, [product.affiliate_url, product.official_url]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
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
      <div className="absolute inset-0 z-0">
          {/* STABILITY PRIORITY: Sales Page Preview > Image > Iframe */}
          
          {product.sales_page_image_url ? (
            <div 
                className="absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${product.sales_page_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center', // ALIGNMENT: Start from top to show Headline/Logo
                    filter: 'blur(2px)',
                    zIndex: 0
                }}
            />
          ) : (
             // Fallback to Iframe if no sales page image
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
                 // User Instruction: "Fully remove isolated bottle/model photo from background"
                 // If no Sales Page Preview and no Iframe, we show a neutral background or nothing (dark/light bg takes over)
                 null
             )
          )}

          {/* Dark Overlay Mask - Optimized for Visibility */}
          <div className="absolute inset-0 bg-black/30" style={{ zIndex: 2 }} />
      </div>

      {/* Main Card */}
      <div 
        className={`
            relative z-10 bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl p-8 text-center
            transform transition-all duration-700 ease-out
            ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
        `}
      >
        {/* Header Icon/Badge */}
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">🛡️</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {product.headline || "Before You Continue"}
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
            {product.subheadline || "Please review the key benefits of this offer to ensure it matches your needs."}
        </p>

        {/* Benefits List */}
        <div className="text-left bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100">
            <ul className="space-y-3">
                {product.bullets.slice(0, 3).map((bullet, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                        <span className="text-green-500 font-bold mr-2 flex-shrink-0">✓</span>
                        {bullet}
                    </li>
                ))}
            </ul>
        </div>

        {/* Action Button */}
        <CTAButton 
            href={ctaUrl} 
            label={product.cta_text || "I Understand, Continue"} 
            className="w-full text-lg py-4 shadow-lg hover:shadow-xl transition-all rounded-xl animate-pulse-scale"
            trackingData={{ product: product.slug, variant: 'cookie_modal' }}
            googleAdsId={product.google_ads_id}
            googleAdsLabel={product.google_ads_label}
        />

        {/* Footer Links (Compliance) */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center space-x-4 text-xs text-gray-400">
            <a href="/legal/privacy" target="_blank" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/legal/terms" target="_blank" className="hover:text-gray-600 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href={product.official_url} target="_blank" rel="nofollow noopener" className="hover:text-gray-600 transition-colors">Official Site</a>
        </div>
      </div>

      {/* Trust Badge overlay */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/20 text-white/80 text-[10px] backdrop-blur-sm border border-white/10">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
            Verified Secure Connection
          </span>
      </div>

    </div>
  );
}
