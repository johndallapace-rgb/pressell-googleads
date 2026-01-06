import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/config';
import EditProductClient from './client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // We are using KV now, so we don't need to check for Edge Config tokens
  // Assuming KV is configured if we got the product
  const readOnly = false;

  return <EditProductClient product={product} readOnly={readOnly} />;
}
