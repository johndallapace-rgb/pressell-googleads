import { redirect } from 'next/navigation';
import { getCampaignConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const config = await getCampaignConfig();
  
  const activeSlug = config.active_product_slug;
  const products = config.products || {};
  
  // 1. Check if the configured active product is actually active
  if (activeSlug && products[activeSlug]?.status === 'active') {
    redirect(`/${activeSlug}`);
  }

  // 2. Fallback: Find the first active product available
  const firstActive = Object.values(products).find(p => p.status === 'active');
  if (firstActive) {
    redirect(`/${firstActive.slug}`);
  }

  // 3. No active campaign found -> Render "No Active Campaign" page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 p-4">
      <div className="max-w-md text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">No Active Campaign</h1>
        <p className="mb-6">
          There are currently no active offers available. Please check back later.
        </p>
      </div>
    </div>
  );
}
