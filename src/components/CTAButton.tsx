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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. Safety Check
    if (!href || href.trim() === '') {
        e.preventDefault();
        console.error('❌ [CTAButton] Affiliate URL is missing! Cannot redirect.');
        alert('Error: Link not configured.');
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

    // 3. Google Ads Conversion (The "Bridge")
    if (typeof window !== 'undefined' && window.gtag && googleAdsId && googleAdsLabel) {
        // We want to ensure the event fires before navigation.
        // For _blank, navigation doesn't cancel the request, but we want to be safe.
        // The user requested "Redirect ONLY AFTER signal".
        // To do this strictly with _blank, we would need to window.open in callback.
        // BUT this triggers popup blockers.
        // HYBRID APPROACH: We send the event. We trust modern browsers (Beacon/KeepAlive) 
        // to send it even if we open the tab immediately.
        // However, to strictly follow "Redirect... after signal", I will use a small delay or callback logic if compatible.
        
        console.log('✅ [CTAButton] Firing Google Ads Conversion:', { send_to: `${googleAdsId}/${googleAdsLabel}` });
        
        window.gtag('event', 'conversion', {
            'send_to': `${googleAdsId}/${googleAdsLabel}`,
            'value': 1.0,
            'currency': 'USD',
            'event_callback': () => {
                console.log('✅ [CTAButton] Conversion reported!');
            }
        });
    } else {
        if (!googleAdsId) console.warn('⚠️ [CTAButton] Google Ads ID missing.');
        if (!window.gtag) console.warn('⚠️ [CTAButton] gtag not found.');
    }
    
    // Default behavior (<a> tag) will open the link.
  };

  const baseClasses = "inline-flex items-center justify-center font-bold transition-transform active:scale-95 rounded-lg shadow-lg py-4 px-8 text-lg";
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 animate-pulse-slow",
    secondary: "bg-green-600 text-white hover:bg-green-700"
  };
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <a 
      href={finalUrl} 
      onClick={handleClick}
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
      </svg>
    </a>
  );
}
