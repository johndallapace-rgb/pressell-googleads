import { getCampaignConfig, listProducts } from '@/lib/config';
import AdsManager from '@/components/admin/AdsManager';

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  // Server-side fetch for security and speed
  const products = await listProducts();
  const activeProducts = products.filter(p => p.status !== 'archived'); // Strict Filter

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-3 text-3xl">📣</span> Google Ads Manager
      </h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        Manage, generate, and launch Google Ads campaigns directly.
        Select a product below to get started.
      </p>
      
      {/* Client Component with Server Data */}
      <AdsManager products={activeProducts} />
    </div>
  );
}

