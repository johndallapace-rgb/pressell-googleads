import { getCampaignConfig } from '@/lib/config';
import AdminForm from '@/components/AdminForm';

export default async function AdminSettingsPage() {
  const config = await getCampaignConfig();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Campaign Settings</h1>
      <AdminForm initialConfig={config} />
    </div>
  );
}
