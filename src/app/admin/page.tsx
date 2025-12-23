import { product } from '@/data/products';

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Product</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{product.name}</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <p>
          <strong>Single Product Mode:</strong> Mitolyn is currently active.
          Configure links in Settings.
        </p>
      </div>
    </div>
  );
}
