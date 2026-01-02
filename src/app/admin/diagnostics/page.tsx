import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig, configClient, CampaignConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function DiagnosticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !(await verifyToken(token))) {
    redirect('/admin/login');
  }

  // Check Env Vars
  const envStatus = {
    EDGE_CONFIG: !!process.env.EDGE_CONFIG,
    EDGE_CONFIG_ID: !!process.env.EDGE_CONFIG_ID,
    VERCEL_API_TOKEN: !!process.env.VERCEL_API_TOKEN,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    JWT_SECRET: !!process.env.JWT_SECRET,
  };

  // Check Edge Config Read
  let edgeConfigReadSuccess = false;
  let rawConfigKeys: string[] = [];
  
  if (configClient) {
    try {
      const rawConfig = await configClient.get<CampaignConfig>('campaign_config');
      if (rawConfig) {
        edgeConfigReadSuccess = true;
        if (rawConfig.products) {
            rawConfigKeys = Object.keys(rawConfig.products);
        }
      }
    } catch (e) {
      console.error('Diagnostics: Edge Config Read Error', e);
    }
  }

  // Get Effective Config
  const config = await getCampaignConfig();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Diagnostics Dashboard</h1>

      <div className="space-y-8">
        {/* Environment Variables */}
        <section className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Environment Variables</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(envStatus).map(([key, exists]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm text-gray-700">{key}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {exists ? 'PRESENT' : 'MISSING'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Edge Config Status */}
        <section className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Edge Config Connection</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Read 'campaign_config' Success:</span>
              <span className={`font-bold ${edgeConfigReadSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {edgeConfigReadSuccess.toString().toUpperCase()}
              </span>
            </div>
            {edgeConfigReadSuccess && (
               <div className="text-sm text-gray-600">
                 Raw keys found in Edge Config: {rawConfigKeys.length > 0 ? rawConfigKeys.join(', ') : 'None'}
               </div>
            )}
             {!process.env.EDGE_CONFIG && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ EDGE_CONFIG env var is missing. Using local default config.
                </div>
            )}
          </div>
        </section>

        {/* Effective Configuration */}
        <section className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Effective Configuration</h2>
          <div className="mb-4">
             <span className="font-medium">Active Product Slug: </span>
             <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{config.active_product_slug}</code>
          </div>
          
          <h3 className="font-medium mb-3">Products List:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">In Edge Config?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.values(config.products).map((product) => (
                  <tr key={product.slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{product.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                        {edgeConfigReadSuccess && rawConfigKeys.includes(product.slug) 
                            ? '✅ Yes' 
                            : '❌ No (Using Default)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}