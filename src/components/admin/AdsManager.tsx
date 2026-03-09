"use client";

import { useState, useEffect } from 'react';
import { ProductConfig } from '@/lib/config';
import { getStrategyRecommendation, generateLaunchChecklist, StrategySettings, AdAssets } from '@/lib/ads/strategyPlanner';
import { convertToCsv } from '@/lib/ads/csv';
import PushCampaignModal from './PushCampaignModal';
import AdPreviewCard from './AdPreviewCard';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';

interface AdsManagerProps {
  products: ProductConfig[];
}

export default function AdsManager({ products }: AdsManagerProps) {
  const [selectedSlug, setSelectedSlug] = useState('');
  
  // Initialize selection with first valid product
  useEffect(() => {
      if (products.length > 0 && !selectedSlug) {
          // Sort by newest? Or just take first.
          // Filter out products that don't make sense if needed (e.g. status != active)
          const activeProducts = products.filter(p => p.status === 'active');
          if (activeProducts.length > 0) {
              setSelectedSlug(activeProducts[0].slug);
          } else if (products.length > 0) {
              setSelectedSlug(products[0].slug);
          }
      }
  }, [products]);
  
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [adsStatus, setAdsStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  
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

  // Check Ads Status
  useEffect(() => {
      fetch('/api/admin/verify-google-ads')
        .then(res => res.json())
        .then(data => setAdsStatus(data.status))
        .catch(() => setAdsStatus('OFFLINE'));
  }, []);

  // Load product data (including existing ads) when slug changes
  useEffect(() => {
    const product = products.find(p => p.slug === selectedSlug);
    if (product) {
        // 1. Strategy & Assets Recommendation
        const { settings, assets } = getStrategyRecommendation(product.vertical, product.language);
        setStrategy(settings);
        setAssets(assets);

        // 2. Load Existing Campaigns from Config (if any)
        if (product.ads?.campaigns && product.ads.campaigns.length > 0) {
            setCampaigns(product.ads.campaigns);
        } else {
            setCampaigns([]);
        }
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
        // Force refresh product data? Ideally parent should re-fetch, but for now local state update is enough
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
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-800">1. Campaign Strategy</h2>
            {adsStatus === 'OFFLINE' && (
                <a href="/api/admin/oauth/google" className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    API Offline (Connect)
                </a>
            )}
            {adsStatus === 'ONLINE' && (
                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    API Online
                </span>
            )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <FormField>
                    <FormLabel>Select Product</FormLabel>
                    <FormSelect 
                        value={selectedSlug} 
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="bg-gray-50 font-medium text-gray-900"
                    >
                        <option value="" disabled>-- Select a Product to Advertise --</option>
                        {products
                            .filter(p => p.status !== 'paused') // Hide paused/archived
                            .map(p => (
                            <option key={p.slug} value={p.slug}>
                                {p.name} ({p.vertical.toUpperCase()})
                            </option>
                        ))}
                    </FormSelect>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField>
                        <FormLabel>Daily Budget ($)</FormLabel>
                        <FormInput 
                            type="number" 
                            value={strategy.dailyBudget}
                            onChange={e => setStrategy({...strategy, dailyBudget: Number(e.target.value)})}
                        />
                    </FormField>
                    <FormField>
                        <FormLabel>CPC Limit ($)</FormLabel>
                        <FormInput 
                            type="number" step="0.1"
                            value={strategy.cpcLimit}
                            onChange={e => setStrategy({...strategy, cpcLimit: Number(e.target.value)})}
                        />
                    </FormField>
                </div>

                <FormField>
                    <FormLabel>Bid Strategy</FormLabel>
                    <FormSelect 
                        value={strategy.bidStrategy}
                        onChange={e => setStrategy({...strategy, bidStrategy: e.target.value as any})}
                    >
                        <option value="Manual CPC">Manual CPC (Recommended for Start)</option>
                        <option value="Maximize Clicks">Maximize Clicks</option>
                        <option value="Maximize Conversions">Maximize Conversions</option>
                    </FormSelect>
                </FormField>
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
                        onClick={() => setPushModalOpen(true)}
                        disabled={adsStatus !== 'ONLINE'}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm font-medium animate-pulse"
                        title={adsStatus !== 'ONLINE' ? "Connect Google Ads API first" : "Launch Campaign"}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Push to Google Ads
                    </button>
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
                <div key={i} className="bg-white p-4 rounded border shadow-sm space-y-4">
                    <div className="flex justify-between">
                        <h4 className="font-bold text-gray-800">{camp.campaignName}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{strategy.bidStrategy}</span>
                    </div>
                    
                    {/* RSA Preview Card */}
                    {camp.adGroups?.[0]?.ads?.[0] && (
                        <div className="mt-2">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Ad Preview</h5>
                            <AdPreviewCard 
                                headlines={camp.adGroups[0].ads[0].headlines}
                                descriptions={camp.adGroups[0].ads[0].descriptions}
                                finalUrl={camp.adGroups[0].ads[0].finalUrl}
                            />
                        </div>
                    )}

                    <div className="text-sm text-gray-600 mt-2 grid grid-cols-3 gap-4 border-t pt-2">
                        <div>Ad Groups: <strong>{camp.adGroups.length}</strong></div>
                        <div>Keywords: <strong>{camp.adGroups.reduce((acc:any, g:any) => acc + g.keywords.length, 0)}</strong></div>
                        <div>Budget: <strong>${strategy.dailyBudget}/day</strong></div>
                    </div>
                </div>
                ))}
            </div>
        )}

        <PushCampaignModal 
            isOpen={pushModalOpen} 
            onClose={() => setPushModalOpen(false)}
            productSlug={selectedSlug}
            productName={products.find(p => p.slug === selectedSlug)?.name || ''}
        />
      </div>
    </div>
  );
}
