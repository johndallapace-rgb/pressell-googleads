"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdPreviewCard from './AdPreviewCard';
import AdEditorModal from './AdEditorModal';
import PublishAdModal from './PublishAdModal';
import { AdsConfig } from '@/lib/ads/types';

interface AdProductSummary {
  slug: string;
  name: string;
  vertical: string;
  languages: string[];
  adsStatus: 'draft' | 'ready' | 'published' | 'paused' | 'exported';
  generatedAt: string | null;
  version: number;
}

interface FullAdDetails {
    ads: AdsConfig | null;
    productName: string;
    officialUrl: string;
}

export default function AdsDashboard() {
  const [products, setProducts] = useState<AdProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  
  // Expanded Row State
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<FullAdDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<{headlines: string[], descriptions: string[]}>({ headlines: [], descriptions: [] });

  // Publish State
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Processing State
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search
      });
      const res = await fetch(`/api/admin/ads/list?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  // Fetch details when expanding a row
  useEffect(() => {
    if (expandedSlug) {
        setDetailsLoading(true);
        fetch(`/api/admin/ads/${expandedSlug}`)
            .then(res => res.json())
            .then(data => setExpandedDetails(data))
            .catch(err => console.error(err))
            .finally(() => setDetailsLoading(false));
    } else {
        setExpandedDetails(null);
    }
  }, [expandedSlug]);

  const toggleSelect = (slug: string) => {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedSlugs(next);
  };

  const toggleSelectAll = () => {
    if (selectedSlugs.size === products.length) {
      setSelectedSlugs(new Set());
    } else {
      setSelectedSlugs(new Set(products.map(p => p.slug)));
    }
  };

  const handleRegenerateAds = async (angle: string) => {
      if (!expandedSlug || !expandedDetails) return;
      
      setProcessing(true);
      setProgress(`Generating ${angle} variations...`);

      try {
          const res = await fetch('/api/admin/generate-copy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  productName: expandedDetails.productName,
                  niche: expandedDetails.ads?.vertical || 'general', // Fallback
                  mode: 'regenerate_ads',
                  angle
              })
          });
          
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          // Update local state temporarily
          const newAds = data.ads; // { headlines: [], descriptions: [] }
          
          // Merge into existing campaign or create structure
          const currentCampaign = expandedDetails.ads?.campaigns?.[0];
          const currentAdGroup = currentCampaign?.adGroups?.[0];
          const currentAd = currentAdGroup?.ads?.[0];

          // Construct updated AdsConfig
          const updatedAdsConfig: any = {
              ...expandedDetails.ads,
              status: 'ready',
              campaigns: [{
                  ...currentCampaign,
                  adGroups: [{
                      ...currentAdGroup,
                      ads: [{
                          ...currentAd,
                          headlines: newAds.headlines,
                          descriptions: newAds.descriptions,
                          finalUrl: currentAd?.finalUrl || expandedDetails.officialUrl
                      }]
                  }]
              }]
          };

          // Save to backend
          await saveAds(expandedSlug, updatedAdsConfig);
          
          // Refresh details
          setExpandedDetails({ ...expandedDetails, ads: updatedAdsConfig });
          alert('✨ Ads Regenerated!');

      } catch (e: any) {
          alert('Error: ' + e.message);
      } finally {
          setProcessing(false);
          setProgress('');
      }
  };

  const saveAds = async (slug: string, adsConfig: AdsConfig) => {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/admin/products/${slug}/ads`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
           },
          body: JSON.stringify(adsConfig)
      });
      fetchProducts(); // Refresh list status
  };

  const openEditor = () => {
      if (!expandedDetails?.ads?.campaigns?.[0]?.adGroups?.[0]?.ads?.[0]) {
          alert('No ads to edit. Generate first.');
          return;
      }
      const ad = expandedDetails.ads.campaigns[0].adGroups[0].ads[0];
      setEditorData({
          headlines: ad.headlines || [],
          descriptions: ad.descriptions || []
      });
      setEditorOpen(true);
  };

  const handleEditorSave = async (data: { headlines: string[], descriptions: string[] }) => {
      if (!expandedSlug || !expandedDetails) return;

      const currentCampaign = expandedDetails.ads?.campaigns?.[0];
      const currentAdGroup = currentCampaign?.adGroups?.[0];
      const currentAd = currentAdGroup?.ads?.[0];

      if (!currentAd) return;

      const updatedAdsConfig: any = {
          ...expandedDetails.ads,
          campaigns: [{
              ...currentCampaign,
              adGroups: [{
                  ...currentAdGroup,
                  ads: [{
                      ...currentAd,
                      headlines: data.headlines,
                      descriptions: data.descriptions
                  }]
              }]
          }]
      };

      await saveAds(expandedSlug, updatedAdsConfig);
      setExpandedDetails({ ...expandedDetails, ads: updatedAdsConfig });
      setEditorOpen(false);
  };

  const handlePublish = async (customerId: string, campaignId: string, adGroupId: string) => {
      if (!expandedSlug || !expandedDetails) return;
      
      const currentAd = expandedDetails.ads?.campaigns?.[0]?.adGroups?.[0]?.ads?.[0];
      if (!currentAd) {
          throw new Error('No ad data found to publish');
      }

      const res = await fetch('/api/admin/ads/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              slug: expandedSlug,
              customerId,
              campaignId,
              adGroupId,
              adData: {
                  headlines: currentAd.headlines,
                  descriptions: currentAd.descriptions,
                  finalUrl: currentAd.finalUrl,
                  path1: currentAd.path1,
                  path2: currentAd.path2
              }
          })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');

      // Update local state
      const updatedAds = {
          ...expandedDetails.ads!,
          status: 'published' as const,
          publication: data.publication
      };
      
      setExpandedDetails({ ...expandedDetails, ads: updatedAds });
      fetchProducts(); // Refresh list
      alert('🚀 Ad Published Successfully!');
  };

  const handleExportCSV = async () => {
      if (selectedSlugs.size === 0) return;
      
      // 1. Fetch details for all selected
      const slugs = Array.from(selectedSlugs);
      const csvRows = [];
      
      // Header for RSA (Google Ads Editor)
      const headers = [
          'Campaign', 'Ad Group', 'Status', 'Final URL', 'Path 1', 'Path 2',
          ...Array.from({length: 15}, (_, i) => `Headline ${i+1}`),
          ...Array.from({length: 4}, (_, i) => `Description ${i+1}`)
      ];
      csvRows.push(headers.join(','));

      setProcessing(true);
      setProgress('Preparing CSV...');

      try {
          for (const slug of slugs) {
              const res = await fetch(`/api/admin/ads/${slug}`);
              const data: FullAdDetails = await res.json();
              
              if (data.ads?.campaigns) {
                  for (const camp of data.ads.campaigns) {
                      for (const group of camp.adGroups) {
                          for (const ad of group.ads) {
                              const row = [
                                  camp.campaignName,
                                  group.name,
                                  'Enabled',
                                  ad.finalUrl,
                                  ad.path1 || '',
                                  ad.path2 || '',
                                  // Headlines (pad to 15)
                                  ...Array.from({length: 15}, (_, i) => `"${(ad.headlines[i] || '').replace(/"/g, '""')}"`),
                                  // Descriptions (pad to 4)
                                  ...Array.from({length: 4}, (_, i) => `"${(ad.descriptions[i] || '').replace(/"/g, '""')}"`)
                              ];
                              csvRows.push(row.join(','));
                          }
                      }
                  }
                  
                  // Mark as Exported
                  await saveAds(slug, { ...data.ads, status: 'exported' });
              }
          }
          
          // Download CSV
          const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `google-ads-export-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
          
          alert('Export Complete! Products marked as Exported.');
          setSelectedSlugs(new Set());
          
      } catch (e) {
          console.error(e);
          alert('Export failed');
      } finally {
          setProcessing(false);
          setProgress('');
      }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header / Toolbar */}
      <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="border rounded px-3 py-2 text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
           {selectedSlugs.size > 0 && (
             <span className="text-sm text-gray-500 mr-2">{selectedSlugs.size} selected</span>
           )}
           <button 
             onClick={handleExportCSV}
             disabled={selectedSlugs.size === 0 || processing}
             className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
           >
             <span>📥</span> Export for Editor
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      {processing && (
          <div className="bg-blue-50 px-4 py-2 text-sm text-blue-700 border-b flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span> {progress}
          </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={products.length > 0 && selectedSlugs.size === products.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-4">Product</th>
              <th className="p-4">Status</th>
              <th className="p-4">Generated</th>
              <th className="p-4 text-right">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No products found.</td></tr>
            ) : (
              products.map(p => {
                  const isExpanded = expandedSlug === p.slug;
                  return (
                    <>
                        <tr key={p.slug} className={`hover:bg-gray-50 group transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}>
                        <td className="p-4">
                            <input 
                            type="checkbox" 
                            checked={selectedSlugs.has(p.slug)}
                            onChange={() => toggleSelect(p.slug)}
                            />
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                            <div className="font-bold">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.slug}</div>
                        </td>
                        <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                                p.adsStatus === 'exported' ? 'bg-purple-100 text-purple-800' :
                                p.adsStatus === 'ready' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {p.adsStatus}
                            </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                            {p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right">
                            <button 
                                onClick={() => setExpandedSlug(isExpanded ? null : p.slug)}
                                className={`text-sm font-medium ${isExpanded ? 'text-blue-700' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                                {isExpanded ? 'Hide Preview ▲' : 'Show Preview ▼'}
                            </button>
                        </td>
                        </tr>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                            <tr className="bg-blue-50/50">
                                <td colSpan={5} className="p-6 border-b border-blue-100">
                                    {detailsLoading ? (
                                        <div className="text-center py-4 text-gray-500">Loading details...</div>
                                    ) : expandedDetails ? (
                                        <div className="flex flex-col md:flex-row gap-8">
                                            {/* Preview Column */}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <span>🔍</span> Google Search Preview
                                                </h4>
                                                {expandedDetails.ads?.campaigns?.[0]?.adGroups?.[0]?.ads?.[0] ? (
                                                    <AdPreviewCard 
                                                        headlines={expandedDetails.ads.campaigns[0].adGroups[0].ads[0].headlines}
                                                        descriptions={expandedDetails.ads.campaigns[0].adGroups[0].ads[0].descriptions}
                                                        finalUrl={expandedDetails.ads.campaigns[0].adGroups[0].ads[0].finalUrl}
                                                    />
                                                ) : (
                                                    <div className="p-8 bg-white rounded border border-dashed border-gray-300 text-center text-gray-500">
                                                        No ads generated yet. Click "Regenerate" to start.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Column */}
                                            <div className="w-full md:w-64 space-y-4">
                                                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                                                    <h5 className="font-bold text-sm text-gray-800 mb-3">Quick Actions</h5>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="relative group">
                                                            <button className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center justify-center gap-2">
                                                                ✨ Regenerate Ads
                                                            </button>
                                                            {/* Dropdown on hover */}
                                                            <div className="hidden group-hover:block absolute top-full left-0 w-full bg-white shadow-lg border rounded mt-1 z-10 p-1">
                                                                <button onClick={() => handleRegenerateAds('Price/Discount')} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">💰 Price Focus</button>
                                                                <button onClick={() => handleRegenerateAds('Curiosity/Hook')} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">🎣 Curiosity Hook</button>
                                                                <button onClick={() => handleRegenerateAds('Authority/Science')} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">🔬 Scientific/Authority</button>
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={openEditor}
                                                            className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                                        >
                                                            ✏️ Edit Manually
                                                        </button>

                                                        {expandedDetails.ads?.status === 'ready' && (
                                                            <button 
                                                                onClick={() => setPublishModalOpen(true)}
                                                                className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm font-bold mt-2"
                                                            >
                                                                🚀 Subir para Google Ads
                                                            </button>
                                                        )}

                                                        {expandedDetails.ads?.status === 'published' && (
                                                            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800 mt-2">
                                                                ✅ Published on {new Date(expandedDetails.ads.publication?.at || '').toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 px-2">
                                                    <strong>Status:</strong> {expandedDetails.ads?.status || 'Draft'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-red-500">Failed to load details.</div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </>
                  );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex justify-between items-center">
         <button 
           disabled={page === 1}
           onClick={() => setPage(p => p - 1)}
           className="px-3 py-1 border rounded text-sm disabled:opacity-50"
         >
           Previous
         </button>
         <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
         <button 
           disabled={page === totalPages}
           onClick={() => setPage(p => p + 1)}
           className="px-3 py-1 border rounded text-sm disabled:opacity-50"
         >
           Next
         </button>
      </div>

      <AdEditorModal 
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleEditorSave}
          initialHeadlines={editorData.headlines}
          initialDescriptions={editorData.descriptions}
      />

      <PublishAdModal 
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onPublish={handlePublish}
          productName={expandedDetails?.productName || ''}
      />
    </div>
  );
}
