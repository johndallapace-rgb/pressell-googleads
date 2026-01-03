"use client";

import { useState } from 'react';
import { ProductConfig } from '@/lib/config';
import { StrategySettings, AdAssets, getStrategyRecommendation, generateLaunchChecklist } from '@/lib/ads/strategyPlanner';
import { convertToCsv } from '@/lib/ads/csv';
import Link from 'next/link';

interface AdsDetailProps {
  product: ProductConfig;
}

export default function AdsDetail({ product }: AdsDetailProps) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<StrategySettings>(
    product.ads?.settings || getStrategyRecommendation(product.vertical, product.language).settings
  );
  
  // If we have saved campaigns, use them. Otherwise empty.
  const [campaigns, setCampaigns] = useState<any[]>(product.ads?.campaigns || []);
  const [status, setStatus] = useState(product.ads?.status || 'draft');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // We use the bulk endpoint for single generation too, as it handles persistence
      // Or we can update the single endpoint. Let's use bulk for consistency if possible, 
      // but bulk doesn't accept custom strategy override per item easily yet.
      // So let's use the single endpoint and update it to accept strategy.
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/ads/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            slug: product.slug,
            strategy // Pass current strategy to save it
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        setStatus('ready');
        alert('Ads generated and saved!');
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

  const handleExportCsv = () => {
    if (campaigns.length === 0) return;
    // We pass the strategy to CSV generator
    // Note: We need assets for CSV recommendation?
    const { assets } = getStrategyRecommendation(product.vertical, product.language);
    const csv = convertToCsv(campaigns, strategy, assets);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-${product.slug}-v${product.ads?.version || 1}.csv`;
    a.click();
  };

  const handleDownloadChecklist = () => {
    const text = generateLaunchChecklist(product.name, product.vertical);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-${product.slug}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <Link href="/admin/ads" className="text-sm text-gray-500 hover:underline">← Back to Dashboard</Link>
            <h1 className="text-2xl font-bold mt-2">{product.name} <span className="text-gray-400 font-normal">Ads Config</span></h1>
         </div>
         <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'published' ? 'bg-green-100 text-green-800' :
                status === 'ready' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
            }`}>
                {status.toUpperCase()}
            </span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Strategy Settings */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Strategy Settings</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget ($)</label>
                        <input 
                            type="number" 
                            value={strategy.dailyBudget}
                            onChange={e => setStrategy({...strategy, dailyBudget: Number(e.target.value)})}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPC Limit ($)</label>
                        <input 
                            type="number" step="0.1"
                            value={strategy.cpcLimit}
                            onChange={e => setStrategy({...strategy, cpcLimit: Number(e.target.value)})}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bid Strategy</label>
                        <select 
                            value={strategy.bidStrategy}
                            onChange={e => setStrategy({...strategy, bidStrategy: e.target.value as any})}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="Manual CPC">Manual CPC</option>
                            <option value="Maximize Clicks">Maximize Clicks</option>
                            <option value="Maximize Conversions">Maximize Conversions</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locations</label>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {strategy.locations.join(", ")}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Save & Generate Ads'}
                    </button>
                </div>
            </div>
            
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Launch Tools</h3>
                <div className="space-y-3">
                    <button 
                        onClick={handleDownloadChecklist}
                        className="w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 flex justify-center items-center"
                    >
                        📝 Download Checklist
                    </button>
                    <button 
                        onClick={handleExportCsv}
                        disabled={campaigns.length === 0}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 flex justify-center items-center"
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Generated Campaigns Preview</h3>
                
                {campaigns.length === 0 ? (
                    <div className="text-center text-gray-400 py-20">
                        <p>No ads generated yet.</p>
                        <p className="text-sm">Adjust settings and click "Generate Ads"</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {campaigns.map((camp, i) => (
                            <div key={i} className="border rounded p-4">
                                <h4 className="font-bold text-lg text-blue-900 mb-2">{camp.campaignName}</h4>
                                <div className="grid gap-4">
                                    {camp.adGroups.map((group: any, j: number) => (
                                        <div key={j} className="bg-gray-50 p-3 rounded">
                                            <div className="font-medium text-gray-700 mb-2">{group.name}</div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                <strong>Keywords:</strong> {group.keywords.slice(0, 5).join(", ")}...
                                            </div>
                                            <div className="space-y-2">
                                                {group.ads.slice(0, 1).map((ad: any, k: number) => (
                                                    <div key={k} className="bg-white border p-3 rounded text-sm">
                                                        <div className="text-blue-600 font-medium hover:underline cursor-pointer">{ad.headlines[0]}</div>
                                                        <div className="text-green-700 text-xs mb-1">{ad.finalUrl}</div>
                                                        <div className="text-gray-600">{ad.descriptions[0]}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
