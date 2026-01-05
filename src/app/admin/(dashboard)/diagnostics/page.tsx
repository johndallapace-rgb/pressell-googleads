import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { CampaignConfig } from '@/lib/config';
import { getVerticalFromHost } from '@/lib/host';
import HealthCheckRunner from '@/components/admin/HealthCheckRunner'; // Import component
import GeminiTestButton from '@/components/admin/GeminiTestButton'; // Import component
import ListModelsButton from '@/components/admin/ListModelsButton'; // New component

export const dynamic = 'force-dynamic';


type Product = {
  name?: string;
  status?: string;
  affiliate_url?: string;
  official_url?: string;
  vertical?: string;
  // outros campos...
};

export default async function DiagnosticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !(await verifyToken(token))) {
    redirect('/admin/login');
  }

  const headerList = await headers();
  const currentHost = headerList.get('host') || '';
  const currentVertical = getVerticalFromHost(currentHost);

  // Check Env Vars
  const envStatus = {
    EDGE_CONFIG: !!process.env.EDGE_CONFIG,
    EDGE_CONFIG_ID: !!process.env.EDGE_CONFIG_ID,
    VERCEL_API_TOKEN: !!process.env.VERCEL_API_TOKEN,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY, // Added for diagnostic
  };

  // Fetch from Edge Config
  let edgeStatus: 'OK' | 'ERROR' = 'ERROR';
  let config: CampaignConfig | null = null;
  let errorMsg = '';
  let configSource = 'unknown';

  try {
    if (process.env.EDGE_CONFIG) {
      const { createClient } = await import('@vercel/edge-config');
      const client = createClient(process.env.EDGE_CONFIG);

      const wrapper = await client.get('campaign_config');
      if (wrapper) {
        config = wrapper as CampaignConfig;
        configSource = 'wrapper (campaign_config)';
        edgeStatus = 'OK';
      } else {
        const products = await client.get('products');
        if (products) {
          config = { products } as CampaignConfig;
          configSource = 'separate keys';
          edgeStatus = 'OK';
        } else {
          errorMsg = 'No config found (wrapper or keys)';
        }
      }
    } else {
      errorMsg = 'EDGE_CONFIG env var missing';
    }
  } catch (err: any) {
    errorMsg = err?.message || 'Unknown error fetching Edge Config';
  }

  const productsObj = (config?.products || {}) as Record<string, Product>;
  const productKeys = Object.keys(productsObj);

  // ✅ Monta rows com slug vindo da chave
  const productRows = Object.entries(productsObj).map(([slug, product]) => ({
    slug,
    ...product,
    // fallback vertical opcional (não substitui a correção no Edge Config)
    vertical: product.vertical || '',
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Diagnostics Dashboard</h1>

      <div className="space-y-8">
        {/* Status Overview */}
        <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded border ${
                edgeStatus === 'OK'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-sm font-bold text-gray-500 uppercase">Edge Config</p>
              <p
                className={`text-2xl font-bold ${
                  edgeStatus === 'OK' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {edgeStatus === 'OK' ? '✅ ACCESSIBLE' : '❌ ERROR'}
              </p>
              {errorMsg && <p className="text-xs text-red-600 mt-1">{errorMsg}</p>}
            </div>

            <div className="p-4 rounded border bg-blue-50 border-blue-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Config Source</p>
              <p className="text-lg font-bold text-blue-700 truncate">{configSource}</p>
            </div>

            <div className="p-4 rounded border bg-purple-50 border-purple-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Gemini Connection</p>
              <div className="mt-2">
                  <GeminiTestButton />
                  <ListModelsButton />
              </div>
            </div>

            <div className="p-4 rounded border bg-purple-50 border-purple-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Active Product</p>
              <p className="text-xl font-bold text-purple-700 truncate">
                {config?.active_product_slug || 'None'}
              </p>
              {/* opcional: mostrar vertical detectado */}
              <p className="text-xs text-purple-600 mt-1">
                Host vertical: {currentVertical || 'none'} ({currentHost})
              </p>
            </div>

            <div className="p-4 rounded border bg-gray-50 border-gray-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Total Products</p>
              <p className="text-2xl font-bold text-gray-700">{productKeys.length}</p>
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Environment Variables
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(envStatus).map(([key, exists]) => (
              <div key={key} className="flex flex-col p-3 bg-gray-50 rounded border border-gray-100">
                <span className="font-mono text-xs text-gray-500 mb-1">{key}</span>
                <span className={`text-sm font-bold ${exists ? 'text-green-600' : 'text-red-600'}`}>
                  {exists ? '✓ PRESENT' : 'MISSING'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Products Table */}
        <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            Products Validation
          </h2>

          {productRows.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
              ⚠️ No products found in configuration.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Affiliate URL</th>
                    <th className="px-4 py-3">Official URL</th>
                    <th className="px-4 py-3">Vertical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productRows.map((p) => (
                    <tr key={p.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{p.slug}</td>
                      <td className="px-4 py-3 text-gray-600">{p.name || '-'}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            p.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.status || 'unknown'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {p.affiliate_url ? (
                          <span className="text-green-600 font-bold text-xs">✓ Set</span>
                        ) : (
                          <span className="text-red-400 font-bold text-xs">Missing</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {p.official_url ? (
                          <span className="text-green-600 font-bold text-xs">✓ Set</span>
                        ) : (
                          <span className="text-red-400 font-bold text-xs">Missing</span>
                        )}
                      </td>

                      <td className="px-4 py-3 capitalize text-gray-600">
                        {p.vertical || <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Smart Health Check Runner */}
        <HealthCheckRunner 
            products={productRows.map(p => ({
                slug: p.slug,
                name: p.name,
                affiliate_url: p.affiliate_url
            }))} 
        />

        {/* Raw Config Dump (Debug) */}
        <details className="bg-gray-50 p-4 rounded border border-gray-200">
          <summary className="cursor-pointer text-gray-500 font-medium text-sm">
            View Raw Configuration (Debug)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded overflow-x-auto text-xs">
            {JSON.stringify(config, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
