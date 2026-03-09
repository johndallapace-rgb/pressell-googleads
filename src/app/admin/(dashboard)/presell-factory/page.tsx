import { getCampaignConfig } from '@/lib/config';
import PresellFactoryPanel from '@/components/admin/PresellFactoryPanel';

export const dynamic = 'force-dynamic';

export default async function PresellFactoryPage() {
    const config = await getCampaignConfig();
    const products = Object.values(config.products || {});

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Presell Factory</h1>
            <p className="text-gray-500 mb-8">
                Generate intent-based presell variants (Review, Price, Side Effects) from a single base product.
            </p>
            
            <PresellFactoryPanel products={products} />
        </div>
    );
}
