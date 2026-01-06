import { listProducts } from '@/lib/config';
import ProductList from '@/components/ProductList';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Force cache invalidation on every request

export default async function ProductsPage() {
  const products = await listProducts();

  // Debug: Log product count to verify KV connection
  console.log(`[Admin] Products fetched from KV: ${products.length}`);

  if (!products || products.length === 0) {
      return (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <h2 className="text-xl font-bold text-gray-400 mb-2">No Products Found</h2>
              <p className="text-gray-500 mb-6">Your new Vercel KV database is empty and ready for action.</p>
              <a href="/admin/products/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  🚀 Create First Product
              </a>
          </div>
      );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center justify-between">
          <span>Manage Products</span>
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">
              KV Storage Active
          </span>
      </h1>
      <ProductList products={products} />
    </div>
  );
}
