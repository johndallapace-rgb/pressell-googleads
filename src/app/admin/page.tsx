import { products } from '@/data/products';

export default function AdminDashboard() {
  const productsCount = products.length;
  // All products in static file are effectively "active" unless filtered logic exists, assuming all for now
  const activeProducts = products.length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{productsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Products</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeProducts}</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <p>
          <strong>Note:</strong> Database mode has been disabled. This admin panel is currently read-only or limited to environment configuration.
          To manage products, edit <code>src/data/products.ts</code> and redeploy.
        </p>
      </div>
    </div>
  );
}
