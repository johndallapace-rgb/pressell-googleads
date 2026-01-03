import { getCampaignConfig } from '@/lib/config';
import SettingsManager from '@/components/SettingsManager';
import CreateProductForm from '@/components/admin/CreateProductForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const config = await getCampaignConfig();
  const readOnly = !process.env.VERCEL_API_TOKEN || !process.env.EDGE_CONFIG_ID;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Global Settings</h1>
      <SettingsManager initialConfig={config} readOnly={readOnly} />
      
      {!readOnly && <CreateProductForm />}
    </div>
  );
}
