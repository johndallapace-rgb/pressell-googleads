'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';

function ThanksContent() {
  const searchParams = useSearchParams();
  
  // Extract parameters (Digistore/ClickBank usually pass these if configured)
  const amount = searchParams.get('amount') || '0';
  const currency = searchParams.get('currency') || 'USD';
  const txid = searchParams.get('txid') || searchParams.get('order_id') || `ord_${Date.now()}`;
  
  // You might want to get the product slug if passed back, to know which Pixel ID to use.
  // Ideally, the Thanks page should be generic, OR we store the Pixel ID in localStorage before redirecting to checkout.
  // OR we assume a global Pixel ID for the domain.
  // Given the architecture, we have product-specific Pixel IDs.
  // If the user lands here, we might not know WHICH product they bought unless passed in URL.
  // Let's assume the affiliate link includes a return URL like: /thanks?product=amino-de
  
  const productSlug = searchParams.get('product'); 
  // If we don't have productSlug, we can't load the specific Google Ads ID easily unless we have a map.
  // For now, let's assume we can fire a generic event or we need to fetch the config.
  
  // However, for Google Ads, the Conversion Label is unique per conversion action.
  // If we have multiple products, we might have multiple conversion actions.
  
  // SIMPLE APPROACH for MVP:
  // 1. Fire a generic Purchase event to the Global Site Tag (if present).
  // 2. If we have `product` param, try to look up IDs (requires fetching config client-side or passing IDs in URL).
  // Passing IDs in URL is risky/ugly.
  // Better: The Checkout Return URL should be: https://health.topproductofficial.com/thanks/[slug] 
  // OR we use a client-side config fetch.
  
  // Let's implement a generic one for now, but enabling data layer push.
  
  useEffect(() => {
    if (amount !== '0') {
      // Google Ads
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'purchase', {
          transaction_id: txid,
          value: amount,
          currency: currency,
          items: [
            {
              id: productSlug || 'generic_product',
              name: productSlug || 'Product',
              price: amount
            }
          ]
        });
      }

      // Meta Pixel
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', {
          value: amount,
          currency: currency,
          content_ids: [productSlug || 'generic'],
          content_type: 'product'
        });
      }
      
      console.log(`[Thanks] Purchase tracked: ${amount} ${currency} (TX: ${txid})`);
    }
  }, [amount, currency, txid, productSlug]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">
            Your order has been confirmed. You will receive an email with your access details shortly.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Order Reference</p>
          <p className="text-lg font-mono text-gray-800 font-bold mt-1">{txid}</p>
        </div>

        <Link 
          href="/" 
          className="inline-block w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all transform hover:-translate-y-1"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ThanksContent />
    </Suspense>
  );
}
