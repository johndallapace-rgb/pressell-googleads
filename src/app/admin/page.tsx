import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  const productsCount = await prisma.product.count();
  const activeProducts = await prisma.product.count({ where: { active: true } });

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
    </div>
  );
}
