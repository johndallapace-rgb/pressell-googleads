'use client';

import { useEffect, useState } from 'react';
import PushCampaignModal from '@/components/admin/PushCampaignModal';

// Mock Data REMOVED
// const MOCK_LOGS = [];

export default function AdsManagerPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<string>('');
  const [pushModalOpen, setPushModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
        try {
            // 1. Fetch Products
            const prodRes = await fetch('/api/admin/products');
            const prodData = await prodRes.json();
            if (prodData.products) {
                // Convert Object to Array if needed
                const productsArray = Array.isArray(prodData.products) 
                    ? prodData.products 
                    : Object.values(prodData.products);
                
                const active = productsArray.filter((p: any) => p.status !== 'archived');
                setActiveProducts(active);
                
                // Auto-select first product for analysis
                if (active.length > 0) {
                    setSelectedProductForAnalysis(active[0].slug);
                }
            }

            // 2. Fetch Metrics (if online)
            const res = await fetch('/api/admin/ads/metrics');
            const data = await res.json();
            if (data.success) {
                setMetrics(data.metrics);
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  const totalSpend = metrics.reduce((acc, m) => acc + parseFloat(m.cost || '0'), 0);
  const totalClicks = metrics.reduce((acc, m) => acc + parseInt(m.clicks || '0'), 0);
  const totalConversions = metrics.reduce((acc, m) => acc + parseFloat(m.conversions || '0'), 0);
  const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<any>(null); // Store AI Ads

  const handleAnalyzeLogs = async () => {
      // If a product is selected, we include its context
      let analysisContext = logs.map(l => 
          `[${l.date}] ${l.campaign} | ${l.type}: ${l.details} | Cost: $${l.cost}`
      ).join('\n');
      
      const product = activeProducts.find(p => p.slug === selectedProductForAnalysis);
      if (product) {
          analysisContext = `PRODUCT CONTEXT:\nName: ${product.name}\nVertical: ${product.vertical}\nHeadlines: ${product.headline}\n\nCAMPAIGN LOGS:\n${analysisContext || 'No logs yet.'}`;
      }

      setAnalyzing(true);
      setAnalysisResult(null);
      setGeneratedAds(null);

      try {
          const res = await fetch('/api/admin/ads/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logs: analysisContext })
          });
          const data = await res.json();
          if (data.analysis) {
              setAnalysisResult(data.analysis);
              if (data.rsaAssets) {
                  setGeneratedAds(data.rsaAssets);
                  // Auto-save to product context in background? 
                  // For now, we pass it to the modal.
              }
          } else {
              alert('Analysis failed: ' + (data.error || 'Unknown error'));
          }
      } catch (e) {
          console.error(e);
          alert('Failed to connect to analyzer.');
      } finally {
          setAnalyzing(false);
      }
  };

  const handleResetSession = async () => {
      if (!confirm('Are you sure you want to clear the Google Ads session? This will disconnect the integration.')) return;
      
      try {
          await fetch('/api/admin/system/reset-token', { method: 'POST' });
          alert('Session Reset! Please reconnect.');
          window.location.reload();
      } catch (e) {
          alert('Failed to reset session');
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ads Performance Manager</h1>
        <div className="flex gap-2">
            <button 
                onClick={handleResetSession}
                className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 flex items-center gap-2 text-sm font-bold border border-red-200"
            >
                🗑️ Reset Session
            </button>
            <button 
                onClick={() => window.open('/api/admin/verify-google-ads', '_blank')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 text-sm font-bold"
            >
                ✅ Verify Tracking
            </button>
        </div>
      </div>

      {/* Log Analyzer Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                   🤖 Gemini Log Analyzer
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                   Paste your raw Google Ads CSV or text logs here. We'll generate actionable optimization advice.
                </p>
                {activeProducts.length > 0 && (
                    <div className="mt-2">
                        <select 
                            value={selectedProductForAnalysis}
                            onChange={(e) => setSelectedProductForAnalysis(e.target.value)}
                            className="text-xs border-purple-300 rounded p-1 bg-white text-purple-900"
                        >
                            {activeProducts.map(p => (
                                <option key={p.slug} value={p.slug}>Target: {p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
              </div>
              <button 
                onClick={handleAnalyzeLogs}
                disabled={analyzing}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2 text-sm font-bold shadow-md disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : '✨ Analyze with Gemini'}
              </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
              <textarea 
                className="w-full h-48 p-4 text-base font-mono border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-black placeholder:text-gray-500 selection:bg-purple-200 selection:text-black"
                placeholder="Paste campaign logs here (Date, Campaign, Cost, Conv. Value...)"
                defaultValue={""}
                onChange={(e) => {
                    // Update logs state or just use value for analysis
                }}
              />
              
              {analysisResult && (
                  <div className="bg-white p-4 rounded border border-purple-200 h-48 overflow-y-auto shadow-inner flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-purple-800 mb-2 text-sm uppercase">Optimization Plan</h4>
                        <div className="prose prose-base text-black whitespace-pre-wrap selection:bg-purple-200 selection:text-black mb-4">
                            {analysisResult}
                        </div>
                      </div>
                      
                      {/* Push Button - Only if Analysis is ready/context is valid */}
                      {selectedProductForAnalysis && (
                          <button 
                              onClick={() => setPushModalOpen(true)}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded font-bold shadow-md hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 transform transition-transform hover:scale-105"
                          >
                              🚀 Push to Google Ads
                          </button>
                      )}
                  </div>
              )}
          </div>
      </div>

      <PushCampaignModal 
          isOpen={pushModalOpen} 
          onClose={() => setPushModalOpen(false)}
          productSlug={selectedProductForAnalysis}
          productName={activeProducts.find(p => p.slug === selectedProductForAnalysis)?.name || 'Product'}
          initialAds={generatedAds}
      />

      {/* Product List Status */}
      <div className="bg-white rounded shadow-sm overflow-hidden mb-6 border border-gray-200">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Active Products & Pixel Status</h3>
              <span className="text-xs text-gray-500">Global Pixel: 17850696537</span>
          </div>
          <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Vertical</th>
                      <th className="px-6 py-3">Pixel Status</th>
                      <th className="px-6 py-3">Checkout Starts</th>
                      <th className="px-6 py-3">Conversion Label</th>
                  </tr>
              </thead>
              <tbody>
                  {activeProducts.length > 0 ? (
                      activeProducts.map((product: any) => (
                      <tr key={product.slug} className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {product.vertical}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              {product.google_ads_id ? (
                                  <span className="text-green-600 font-bold">● Active</span>
                              ) : (
                                  <span className="text-gray-400">○ Pending</span>
                              )}
                          </td>
                          <td className="px-6 py-4">-</td>
                          <td className="px-6 py-4 font-mono text-xs">{product.google_ads_label || '-'}</td>
                      </tr>
                      ))
                  ) : (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              No active products found. <a href="/admin/my-products" className="text-blue-600 underline">Add a product</a> to get started.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase">Total Spend (Live)</p>
              <p className="text-2xl font-bold">${totalSpend.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500">
              <p className="text-xs text-gray-500 uppercase">Conversions (Ads)</p>
              <p className="text-2xl font-bold">{totalConversions}</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-500">
              <p className="text-xs text-gray-500 uppercase">Clicks</p>
              <p className="text-2xl font-bold">{totalClicks}</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-gray-500 uppercase">Avg CPC</p>
              <p className="text-2xl font-bold">${avgCpc.toFixed(2)}</p>
          </div>
      </div>

      {/* Ads Campaigns Table */}
      <div className="bg-white rounded shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-700">📢 Active Google Ads Campaigns</h3>
          </div>
          {loading ? (
              <div className="p-6 text-center text-gray-500">Loading metrics from Google Ads...</div>
          ) : metrics.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                  <p className="mb-4">No active campaigns found in account 338-031-9096.</p>
                  <button 
                      onClick={() => window.open('/api/admin/oauth/google', '_blank')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold inline-flex items-center gap-2"
                  >
                      🔄 Reconnect Google Ads
                  </button>
              </div>
          ) : (
              <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                          <th className="px-6 py-3">Campaign</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Impressions</th>
                          <th className="px-6 py-3">Clicks</th>
                          <th className="px-6 py-3">Cost</th>
                          <th className="px-6 py-3">Conv.</th>
                      </tr>
                  </thead>
                  <tbody>
                      {metrics.map(m => (
                          <tr key={m.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      m.status === 'ENABLED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                      {m.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4">{m.impressions}</td>
                              <td className="px-6 py-4">{m.clicks}</td>
                              <td className="px-6 py-4">${m.cost}</td>
                              <td className="px-6 py-4">{m.conversions}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
              <h3 className="font-bold text-gray-700">Real-time Activity Log</h3>
          </div>
          <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">Cost</th>
                  </tr>
              </thead>
              <tbody>
                  {logs.map(log => (
                      <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">{log.date}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.campaign}</td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  log.type === 'Conversion' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                  {log.type}
                              </span>
                          </td>
                          <td className="px-6 py-4">{log.details}</td>
                          <td className="px-6 py-4">${log.cost.toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}
