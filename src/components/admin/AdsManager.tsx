"use client";

import { useState, useEffect } from 'react';
import { ProductConfig } from '@/lib/config';
import { getStrategyRecommendation, generateLaunchChecklist, StrategySettings, AdAssets } from '@/lib/ads/strategyPlanner';
import { convertToCsv } from '@/lib/ads/csv';

interface AdsManagerProps {
  products: ProductConfig[];
}

export default function AdsManager({ products }: AdsManagerProps) {
  const [selectedSlug, setSelectedSlug] = useState(products[0]?.slug || '');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Strategy State
  const [strategy, setStrategy] = useState<StrategySettings>({
    bidStrategy: 'Manual CPC',
    dailyBudget: 50,
    cpcLimit: 2.0,
    locations: ['United States'],
    languages: ['en'],
    networks: 'Search'
  });
  const [assets, setAssets] = useState<AdAssets | null>(null);

  // Load recommendations when product changes
  useEffect(() => {
    const product = products.find(p => p.slug === selectedSlug);
    if (product) {
        const { settings, assets } = getStrategyRecommendation(product.vertical, product.language);
        setStrategy(settings);
        setAssets(assets);
    }
  }, [selectedSlug, products]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/ads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ slug: selectedSlug })
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (campaigns.length === 0) return;
    
    // Use the updated CSV generator with strategy settings
    const csv = convertToCsv(campaigns, strategy, assets || undefined);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-${selectedSlug}.csv`;
    a.click();
  };

  const handleDownloadChecklist = () => {
    const product = products.find(p => p.slug === selectedSlug);
    if (!product) return;
    const text = generateLaunchChecklist(product.name, product.vertical);
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-${selectedSlug}.txt`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Product Selection & Strategy */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Campaign Strategy</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                    <select 
                        value={selectedSlug} 
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    >
                        {products.map(p => (
                        <option key={p.slug} value={p.slug}>{p.name} ({p.vertical})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                value={strategy.dailyBudget}
                                onChange={e => setStrategy({...strategy, dailyBudget: Number(e.target.value)})}
                                className="w-full border rounded pl-7 pr-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPC Limit</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" step="0.1"
                                value={strategy.cpcLimit}
                                onChange={e => setStrategy({...strategy, cpcLimit: Number(e.target.value)})}
                                className="w-full border rounded pl-7 pr-3 py-2"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid Strategy</label>
                    <select 
                        value={strategy.bidStrategy}
                        onChange={e => setStrategy({...strategy, bidStrategy: e.target.value as any})}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="Manual CPC">Manual CPC (Recommended for Start)</option>
                        <option value="Maximize Clicks">Maximize Clicks</option>
                        <option value="Maximize Conversions">Maximize Conversions</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded border border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Recommended Assets</h3>
                {assets ? (
                    <div className="text-sm space-y-3">
                        <div>
                            <span className="font-medium text-gray-900">Sitelinks:</span>
                            <ul className="list-disc list-inside text-gray-600 ml-2 mt-1">
                                {assets.sitelinks.map((s, i) => (
                                    <li key={i}>{s.text} <span className="text-xs text-gray-400">({s.desc1})</span></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">Callouts:</span>
                            <p className="text-gray-600 mt-1">{assets.callouts.join(", ")}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Loading recommendations...</p>
                )}
            </div>
        </div>
      </div>

      {/* Generation Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">2. Generate & Export</h2>
        <div className="flex gap-4 items-center">
            <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
            {loading ? 'Generating...' : 'Generate Campaigns'}
            </button>
            
            {campaigns.length > 0 && (
                <div className="flex gap-3 ml-auto">
                    <button 
                        onClick={handleDownloadChecklist}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 flex items-center bg-white"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Download Checklist
                    </button>
                    <button 
                        onClick={handleExportCsv}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center shadow-sm font-medium"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                    </button>
                </div>
            )}
        </div>

        {campaigns.length > 0 && (
            <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto border rounded p-4 bg-gray-50">
                {campaigns.map((camp, i) => (
                <div key={i} className="bg-white p-4 rounded border shadow-sm">
                    <div className="flex justify-between">
                        <h4 className="font-bold text-gray-800">{camp.campaignName}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{strategy.bidStrategy}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 grid grid-cols-3 gap-4">
                        <div>Ad Groups: <strong>{camp.adGroups.length}</strong></div>
                        <div>Keywords: <strong>{camp.adGroups.reduce((acc:any, g:any) => acc + g.keywords.length, 0)}</strong></div>
                        <div>Budget: <strong>${strategy.dailyBudget}/day</strong></div>
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
