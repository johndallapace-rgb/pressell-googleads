import { listProducts } from '@/lib/config';
import AdsManager from '@/components/admin/AdsManager';

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-3 text-3xl">📣</span> Google Ads Manager
      </h1>
      <p className="text-gray-600 mb-8">
        Generate high-converting Search campaigns (BOFU) automatically for all supported languages.
      </p>
      
      <AdsManager products={products} />
    </div>
  );
}
