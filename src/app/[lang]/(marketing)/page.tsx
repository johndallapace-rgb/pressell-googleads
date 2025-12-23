import { redirect } from 'next/navigation';
import { PageProps } from '@/types';

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  // Redirect to the default product
  redirect(`/${lang}/p/mitolyn`);
}
