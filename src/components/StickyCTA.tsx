'use client';

import { useEffect, useState } from 'react';
import { CTAButton } from './CTAButton';

interface StickyCTAProps {
  href: string;
  label: string;
  trackingData?: {
    product: string;
    variant?: string;
    lang?: string;
  };
  googleAdsId?: string;
  googleAdsLabel?: string;
}

export function StickyCTA({ href, label, trackingData, googleAdsId, googleAdsLabel }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      // Show after 50% scroll
      if (scrollPercent > 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-xl z-50 md:hidden animate-slide-up">
      <CTAButton href={href} label={label} fullWidth trackingData={trackingData} googleAdsId={googleAdsId} googleAdsLabel={googleAdsLabel} />
    </div>
  );
}
