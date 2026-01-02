'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { ProductConfig } from '@/lib/config';

export default function EditProductClient({ product, readOnly = false }: { product: ProductConfig, readOnly?: boolean }) {
  const router = useRouter();

  const handleSave = async (updatedProduct: ProductConfig) => {
    const res = await fetch('/api/admin/products/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: updatedProduct }),
    });

    if (!res.ok) {
      throw new Error('Failed to update product');
    }

    router.push('/admin/products');
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Product: {product.name}</h1>
      <ProductForm initialProduct={product} onSubmit={handleSave} />
    </div>
  );
}
