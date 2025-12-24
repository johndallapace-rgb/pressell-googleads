import { redirect } from 'next/navigation';
import { getCampaignConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const config = await getCampaignConfig();
  // Default to mitolyn if somehow empty, though type says string
  const target = config.active_product_slug || 'mitolyn';
  redirect(`/${target}`);
}
