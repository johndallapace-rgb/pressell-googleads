import { listProducts } from '@/lib/config';
import ProductList from '@/components/ProductList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>
      <ProductList products={products} />
    </div>
  );
}
