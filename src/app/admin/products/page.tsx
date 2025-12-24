import { getCampaignConfig } from '@/lib/config';
import ProductManager from '@/components/ProductManager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const config = await getCampaignConfig();
  const readOnly = !process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>
      <ProductManager initialConfig={config} readOnly={readOnly} />
    </div>
  );
}
