'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { ProductConfig } from '@/lib/config';

export default function NewProductPage() {
  const router = useRouter();

  const handleSave = async (product: ProductConfig) => {
    const res = await fetch('/api/admin/products/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });

    if (!res.ok) {
      throw new Error('Failed to create product');
    }

    router.push('/admin/products');
    router.refresh();
  };

  const readOnly = !process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      <ProductForm onSubmit={handleSave} isNew={true} readOnly={readOnly} />
    </div>
  );
}
