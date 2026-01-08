import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { CampaignConfig, getCampaignConfig, kv } from '@/lib/config'; // Use Centralized Config
import { getVerticalFromHost } from '@/lib/host';
import HealthCheckRunner from '@/components/admin/HealthCheckRunner'; 
import GeminiTestButton from '@/components/admin/GeminiTestButton'; 
import ListModelsButton from '@/components/admin/ListModelsButton'; 
import KvTestButton from '@/components/admin/KvTestButton'; // New component

export const dynamic = 'force-dynamic';

type Product = {
  name?: string;
  status?: string;
  affiliate_url?: string;
  official_url?: string;
  vertical?: string;
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
    // Vercel KV (Priority)
    KV_URL: !!process.env.KV_URL,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    // Upstash / Legacy
    REDIS_URL: !!process.env.REDIS_URL,
    // App Secrets
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  };

  // Fetch from KV (Centralized)
  let dbStatus: 'OK' | 'ERROR' = 'ERROR';
  let config: CampaignConfig | null = null;
  let errorMsg = '';
  let configSource = 'Vercel KV';
  let totalKeys = 0;

  try {
    // 1. Get Config Index
    config = await getCampaignConfig();
    
    // 2. Check KV Connection & Count Keys
    if (kv) {
        try {
            const keys = await kv.keys('*');
            totalKeys = keys.length;
            dbStatus = 'OK';
        } catch (e: any) {
            errorMsg = `KV Connection Error: ${e.message}`;
            dbStatus = 'ERROR';
        }
    } else {
        errorMsg = 'KV Client not initialized';
        dbStatus = 'ERROR';
    }

  } catch (err: any) {
    errorMsg = err?.message || 'Unknown error fetching Config';
  }

  const productsObj = (config?.products || {}) as Record<string, Product>;
  // We use the keys from the loaded config, which should match KV if sync is correct.
  // However, the 'Total Keys' metric above is more raw.
  const productKeys = Object.keys(productsObj);

  // ✅ Monta rows com slug vindo da chave
  const productRows = Object.entries(productsObj).map(([slug, product]) => ({
    slug,
    ...product,
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
            
            {/* Vercel KV Status */}
            <div
              className={`p-4 rounded border ${
                dbStatus === 'OK'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-sm font-bold text-gray-500 uppercase">Vercel KV</p>
              <p
                className={`text-2xl font-bold ${
                  dbStatus === 'OK' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {dbStatus === 'OK' ? '✅ CONNECTED' : '❌ ERROR'}
              </p>
              {errorMsg && <p className="text-xs text-red-600 mt-1">{errorMsg}</p>}
              <div className="mt-2">
                 <KvTestButton />
              </div>
            </div>

            <div className="p-4 rounded border bg-blue-50 border-blue-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Config Source</p>
              <p className="text-lg font-bold text-blue-700 truncate">{configSource}</p>
              <p className="text-xs text-blue-600 mt-1">Total Keys in DB: {totalKeys}</p>
            </div>

            <div className="p-4 rounded border bg-purple-50 border-purple-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Gemini AI</p>
              <div className="mt-2 space-y-2">
                  <GeminiTestButton />
                  <ListModelsButton />
              </div>
            </div>

            <div className="p-4 rounded border bg-gray-50 border-gray-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Active Products</p>
              <p className="text-2xl font-bold text-gray-700">{productKeys.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                Vertical: {currentVertical || 'none'}
              </p>
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
