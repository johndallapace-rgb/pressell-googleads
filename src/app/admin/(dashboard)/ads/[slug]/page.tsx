import { getProduct } from '@/lib/config';
import AdsDetail from '@/components/admin/AdsDetail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdsDetailPage(props: PageProps) {
  const params = await props.params;
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <AdsDetail product={product} />
    </div>
  );
}
