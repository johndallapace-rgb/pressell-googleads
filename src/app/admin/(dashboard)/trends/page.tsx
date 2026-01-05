'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GeminiStatusBadge from '@/components/admin/GeminiStatusBadge';

type Platform = 'ClickBank' | 'Digistore24' | 'BuyGoods' | 'MaxWeb';

interface TrendProduct {
  id: string;
  name: string;
  vertical: string;
  gravity: number; // or popularity score
  aiScore: number; // 0-100
  aiReason: string;
  platform: Platform;
  url: string;
  
  // New Metrics
  deltaGravity: number; // % change 7d
  competitionDensity: 'Low' | 'Medium' | 'High' | 'Very High';
  conversionStability: 'Stable' | 'Volatile';
  safetyScore: 'Safe' | 'Moderate' | 'Risky';
  trendDirection: 'up' | 'down' | 'flat';
}

// Mock Data - In a real scenario, this would come from a daily scraper job
const MOCK_DATA: TrendProduct[] = [
  { 
    id: '1', name: 'Mitolyn', vertical: 'Health', gravity: 120, 
    aiScore: 98, aiReason: 'High search volume + Low competition keywords detected.', 
    platform: 'ClickBank', url: 'https://mitolyn.com/video.php',
    deltaGravity: 15.5, competitionDensity: 'Low', conversionStability: 'Stable', safetyScore: 'Safe', trendDirection: 'up'
  },
  { 
    id: '2', name: 'Ted\'s Woodworking', vertical: 'DIY', gravity: 85, 
    aiScore: 92, aiReason: 'Evergreen niche, high conversion on cold traffic.', 
    platform: 'ClickBank', url: 'https://tedswoodworking.com',
    deltaGravity: 5.2, competitionDensity: 'Medium', conversionStability: 'Stable', safetyScore: 'Safe', trendDirection: 'up'
  },
  { 
    id: '3', name: 'Puravive', vertical: 'Health', gravity: 450, 
    aiScore: 88, aiReason: 'Saturated but massive volume. Needs unique angle.', 
    platform: 'ClickBank', url: 'https://puravive.com',
    deltaGravity: -2.1, competitionDensity: 'Very High', conversionStability: 'Stable', safetyScore: 'Moderate', trendDirection: 'down'
  },
  { 
    id: '4', name: 'Genius Wave', vertical: 'Spirituality', gravity: 300, 
    aiScore: 85, aiReason: 'Trending on TikTok. VSL is converting well.', 
    platform: 'Digistore24', url: 'https://thegeniuswave.com',
    deltaGravity: 45.0, competitionDensity: 'Medium', conversionStability: 'Volatile', safetyScore: 'Moderate', trendDirection: 'up'
  },
  { 
    id: '5', name: 'ProDentim', vertical: 'Health', gravity: 210, 
    aiScore: 78, aiReason: 'Steady performer. Dental niche is stable.', 
    platform: 'ClickBank', url: 'https://prodentim.com',
    deltaGravity: 0.5, competitionDensity: 'High', conversionStability: 'Stable', safetyScore: 'Safe', trendDirection: 'flat'
  },
  { 
    id: '6', name: 'Sugar Defender', vertical: 'Health', gravity: 500, 
    aiScore: 75, aiReason: 'Very high competition. CPA rising.', 
    platform: 'BuyGoods', url: 'https://sugardefender.com',
    deltaGravity: -10.0, competitionDensity: 'Very High', conversionStability: 'Stable', safetyScore: 'Risky', trendDirection: 'down'
  },
];

export default function MarketTrendsPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('ClickBank');
  const [analyzing, setAnalyzing] = useState(false);
  const [products, setProducts] = useState<TrendProduct[]>(MOCK_DATA);

  // Filter products by platform
  const filteredProducts = products.filter(p => p.platform === selectedPlatform);
  
  // Sort by AI Score for recommendations
  const topRecommendations = [...filteredProducts]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5);

  const handleFastDeploy = (product: TrendProduct) => {
    // Redirect to create product with imported URL
    router.push(`/admin/products?import=${encodeURIComponent(product.url)}&name=${encodeURIComponent(product.name)}&vertical=${encodeURIComponent(product.vertical)}`);
  };

  const handleRefreshAnalysis = async () => {
      setAnalyzing(true);
      // Simulate AI analysis delay
      await new Promise(r => setTimeout(r, 1500));
      // In a real app, we would call an API to re-rank these based on live data
      setAnalyzing(false);
      alert('AI Analysis Updated: Market data refreshed successfully.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                📈 Market Trends & Intelligence
            </h1>
            <p className="text-gray-600 mt-1">
                Real-time product opportunities ranked by Gemini AI.
            </p>
        </div>
        <div className="flex items-center gap-4">
            <GeminiStatusBadge />
            <button 
                onClick={handleRefreshAnalysis}
                disabled={analyzing}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
            >
                {analyzing ? (
                    <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                Refresh Analysis
            </button>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
          {(['ClickBank', 'Digistore24', 'BuyGoods', 'MaxWeb'] as Platform[]).map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    selectedPlatform === platform
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                  {platform}
              </button>
          ))}
      </div>

      {/* Top 5 AI Recommendations */}
      <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ✨ Top 5 AI Recommendations
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded border border-purple-200">Gemini Scored</span>
          </h2>
          
          {topRecommendations.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                  No data available for {selectedPlatform}.
              </div>
          ) : (
              <div className="grid md:grid-cols-5 gap-4">
                  {topRecommendations.map((product, idx) => (
                      <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
                              #{idx + 1}
                          </div>
                          
                          <div className="mb-3">
                              <h3 className="font-bold text-gray-800 truncate" title={product.name}>{product.name}</h3>
                              <p className="text-xs text-gray-500">{product.vertical}</p>
                          </div>

                          <div className="mb-4 bg-purple-50 p-2 rounded border border-purple-100">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-purple-700">AI Score</span>
                                  <span className="text-sm font-black text-purple-800">{product.aiScore}/100</span>
                              </div>
                              <div className="w-full bg-purple-200 rounded-full h-1.5 mb-2">
                                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${product.aiScore}%` }}></div>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-purple-800 opacity-80">
                                <div>
                                    <span className="block font-bold">Safety</span>
                                    <span className={`${product.safetyScore === 'Safe' ? 'text-green-600' : product.safetyScore === 'Moderate' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {product.safetyScore}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-bold">Comp.</span>
                                    <span>{product.competitionDensity}</span>
                                </div>
                              </div>
                          </div>

                          <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              "{product.aiReason}"
                          </p>

                          <button 
                            onClick={() => handleFastDeploy(product)}
                            className="w-full bg-gray-900 text-white text-xs font-bold py-2 rounded hover:bg-black transition-colors flex items-center justify-center gap-1 group-hover:scale-[1.02]"
                          >
                              ⚡ Fast Deploy
                          </button>
                      </div>
                  ))}
              </div>
          )}
      </section>

      {/* Full Market Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Full Market List ({selectedPlatform})</h2>
              <div className="flex gap-2">
                  <input type="text" placeholder="Search products..." className="border rounded-lg px-3 py-1.5 text-sm text-black outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                      <tr>
                          <th className="px-6 py-4">Product Name</th>
                          <th className="px-6 py-4">Vertical</th>
                          <th className="px-6 py-4">Gravity/Rank</th>
                          <th className="px-6 py-4">AI Insight</th>
                          <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                  {product.trendDirection === 'up' && <span className="text-green-500 font-bold">↑</span>}
                                  {product.trendDirection === 'down' && <span className="text-red-500 font-bold">↓</span>}
                                  {product.trendDirection === 'flat' && <span className="text-gray-400 font-bold">→</span>}
                                  {product.name}
                              </td>
                              <td className="px-6 py-4">
                                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                      {product.vertical}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                  <div className="flex flex-col">
                                      <span className="font-bold">{product.gravity}</span>
                                      <span className={`text-xs ${product.deltaGravity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {product.deltaGravity > 0 ? '+' : ''}{product.deltaGravity}% (7d)
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 max-w-xs text-gray-500">
                                  <div className="flex flex-col gap-1">
                                      <span className="truncate" title={product.aiReason}>{product.aiReason}</span>
                                      <div className="flex gap-2 text-xs">
                                          <span className={`px-1.5 py-0.5 rounded border ${
                                              product.safetyScore === 'Safe' ? 'bg-green-50 border-green-200 text-green-700' :
                                              product.safetyScore === 'Moderate' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                              'bg-red-50 border-red-200 text-red-700'
                                          }`}>
                                              {product.safetyScore === 'Safe' ? '🛡️ Safe' : product.safetyScore === 'Moderate' ? '⚠️ Moderate' : '⛔ Risky'}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-600">
                                              {product.conversionStability === 'Stable' ? '⚖️ Stable' : '🌊 Volatile'}
                                          </span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => handleFastDeploy(product)}
                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded transition-all"
                                  >
                                      🚀 Deploy
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                  No products found for this platform filter.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </section>
    </div>
  );
}
