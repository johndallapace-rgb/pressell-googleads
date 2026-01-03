'use client';

import { useEffect, useState } from 'react';
import { buildOutgoingUrl, trackEvent } from '@/lib/tracking';

interface CTAButtonProps {
  href: string;
  label: string;
  className?: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  trackingData?: {
    product: string;
    variant?: string;
    lang?: string;
  };
  googleAdsId?: string;
  googleAdsLabel?: string;
}

export function CTAButton({ href, label, className = '', variant = 'primary', fullWidth = false, trackingData, googleAdsId, googleAdsLabel }: CTAButtonProps) {
  const [finalUrl, setFinalUrl] = useState(href);

  useEffect(() => {
    setFinalUrl(buildOutgoingUrl(href));
  }, [href]);

  const isLinkValid = href && href.trim() !== '';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. Safety Check (Shielding)
    if (!isLinkValid) {
        e.preventDefault();
        console.error('❌ [CTAButton] Affiliate URL is missing! Interaction blocked.');
        alert('Configuration Error: Affiliate Link is missing. Please check the admin panel.');
        return;
    }

    // 2. Internal Tracking
    trackEvent('presell_click', {
      url: finalUrl,
      label: label,
      product: trackingData?.product || 'unknown',
      variant: trackingData?.variant || 'default',
      lang: trackingData?.lang || 'en'
    });

    // 3. Google Ads Conversion
    const productSlug = trackingData?.product || 'unknown';
    
    if (typeof window !== 'undefined' && window.gtag && googleAdsId && googleAdsLabel) {
        const sendTo = `${googleAdsId}/${googleAdsLabel}`;
        
        console.log(`Conversion Fired: ${productSlug} (Label: ${googleAdsLabel})`);
        
        // Fire Conversion Event
        window.gtag('event', 'conversion', {
            'send_to': sendTo,
            'value': 1.0,
            'currency': 'USD',
            'event_callback': () => {
                console.log('✅ [CTAButton] GTag Callback received.');
            }
        });

        // Note: Since we use target="_blank", the page stays open and the script continues running.
        // We do not need to delay navigation via preventDefault + setTimeout, which would trigger popup blockers.
        // The conversion signal is sent reliably while the new tab opens.
    } else {
        if (!googleAdsId) console.warn('⚠️ [CTAButton] Google Ads ID missing.');
        if (!googleAdsLabel) console.warn('⚠️ [CTAButton] Conversion Label missing.');
        if (!window.gtag) console.warn('⚠️ [CTAButton] gtag not found (yet).');
    }
  };

  const baseClasses = "inline-flex items-center justify-center font-bold transition-transform active:scale-95 rounded-lg shadow-lg py-4 px-8 text-lg";
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 animate-pulse-slow",
    secondary: "bg-green-600 text-white hover:bg-green-700"
  };
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = !isLinkValid ? "opacity-50 cursor-not-allowed grayscale" : "";

  return (
    <a 
      href={isLinkValid ? finalUrl : '#'} 
      onClick={handleClick}
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className} ${disabledClass}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      {isLinkValid && (
        <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      )}
    </a>
  );
}
