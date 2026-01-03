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

  const readOnly = !process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID;

  return <EditProductClient product={product} readOnly={readOnly} />;
}
