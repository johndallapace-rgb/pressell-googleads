import AdsDashboard from '@/components/admin/AdsDashboard';

export const dynamic = 'force-dynamic';

export default function AdsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-3 text-3xl">📣</span> Google Ads Manager
      </h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        Manage, generate, and export Google Ads campaigns for all your products.
        Use bulk actions to generate ad copy for multiple products at once.
      </p>
      
      <AdsDashboard />
    </div>
  );
}
