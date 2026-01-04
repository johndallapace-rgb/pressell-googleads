import { getCampaignConfig } from '@/lib/config';

export default async function AdminDashboard() {
  const config = await getCampaignConfig();
  const activeSlug = config.active_product_slug || 'mitolyn';
  const activeProduct = config.products[activeSlug] || config.products['mitolyn'];
  const productName = activeProduct ? activeProduct.name : 'Unknown Product';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🚀 Mission Control</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Campaign</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2 truncate" title={productName}>{productName}</p>
          <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded mt-2 inline-block">LIVE</span>
        </div>
        
        {/* Last Spy Widget */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase flex items-center gap-2">
             🕵️ Last Spy
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">Mitolyn</p>
          <span className="text-xs text-gray-400">Just now</span>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Conversions</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
          <span className="text-xs text-gray-400">Last 24h</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase">System Health</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">100%</p>
          <span className="text-xs text-gray-400">All Systems Operational</span>
        </div>
      </div>

      {/* Domain Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-700">🌍 Domain Vertical Status</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded bg-blue-50 border-blue-100">
                  <div className="flex items-center gap-3">
                      <span className="text-2xl">💊</span>
                      <div>
                          <p className="font-bold text-blue-900">Health Vertical</p>
                          <p className="text-xs text-blue-700">health.topproductofficial.com</p>
                      </div>
                  </div>
                  <span className="text-green-600 font-bold text-sm">● Online</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded bg-orange-50 border-orange-100">
                  <div className="flex items-center gap-3">
                      <span className="text-2xl">🔨</span>
                      <div>
                          <p className="font-bold text-orange-900">DIY Vertical</p>
                          <p className="text-xs text-orange-700">diy.topproductofficial.com</p>
                      </div>
                  </div>
                  <span className="text-green-600 font-bold text-sm">● Online</span>
              </div>
          </div>
      </div>
      
      {/* Quick Actions */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-md text-purple-800">
        <p className="font-bold mb-2">💡 Pro Tip:</p>
        <p className="text-sm">
          Use the <strong>Ads Manager</strong> to export logs for Gemini analysis. 
          Keep your "Google Ads ID" (17850696537) consistent across all campaigns for better pixel learning.
        </p>
      </div>
    </div>
  );
}
