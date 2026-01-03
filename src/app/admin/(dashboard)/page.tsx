import { getCampaignConfig } from '@/lib/config';

export default async function AdminDashboard() {
  const config = await getCampaignConfig();
  const activeSlug = config.active_product_slug || 'mitolyn';
  const activeProduct = config.products[activeSlug] || config.products['mitolyn'];

  // Handle case where config might be missing product details if not properly initialized
  const productName = activeProduct ? activeProduct.name : 'Unknown Product';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Product</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{productName}</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
        <p>
          <strong>Multi-Product System:</strong> Currently serving <strong>{productName}</strong> as the default home page.
          <br/>
          You can switch active products and edit links in <strong>Settings</strong>.
        </p>
      </div>
    </div>
  );
}
