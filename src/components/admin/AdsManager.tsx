'use client';

import { useState } from 'react';
import { ProductConfig } from '@/lib/config';

interface AdsManagerProps {
  products: ProductConfig[];
}

export default function AdsManager({ products }: AdsManagerProps) {
  const [selectedSlug, setSelectedSlug] = useState(products[0]?.slug || '');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

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
    
    // Client-side CSV generation for simplicity
    const headers = [
        "Campaign", "Ad Group", "Keyword", "Criterion Type", 
        "Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5",
        "Description 1", "Description 2", "Final URL", "Path 1", "Path 2"
    ];
    let csv = headers.join(",") + "\n";

    campaigns.forEach(camp => {
        camp.adGroups.forEach((group: any) => {
            // Keywords
            group.keywords.forEach((kw: string) => {
                const matchType = kw.startsWith('[') ? 'Exact' : 'Phrase';
                const cleanKw = kw.replace(/[\[\]"]/g, '');
                csv += `"${camp.campaignName}","${group.name}","${cleanKw}","${matchType}",,,,,,,,,\n`;
            });
            // Ad
            const ad = group.ads[0];
            csv += `"${camp.campaignName}","${group.name}","","RSA",` +
                `"${ad.headlines[0] || ''}","${ad.headlines[1] || ''}","${ad.headlines[2] || ''}","${ad.headlines[3] || ''}","${ad.headlines[4] || ''}",` +
                `"${ad.descriptions[0] || ''}","${ad.descriptions[1] || ''}",` +
                `"${ad.finalUrl}","${ad.path1 || ''}","${ad.path2 || ''}"\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-${selectedSlug}.csv`;
    a.click();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex gap-4 items-end mb-8">
        <div className="flex-1">
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
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Ads'}
        </button>
      </div>

      {campaigns.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Generated Campaigns ({campaigns.length})</h3>
            <button 
              onClick={handleExportCsv}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download CSV
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto border rounded p-4 bg-gray-50">
            {campaigns.map((camp, i) => (
              <div key={i} className="bg-white p-4 rounded border shadow-sm">
                <h4 className="font-bold text-gray-800">{camp.campaignName}</h4>
                <div className="text-sm text-gray-600 mt-2">
                  <p>Ad Groups: {camp.adGroups.length}</p>
                  <p>Keywords: {camp.adGroups.reduce((acc:any, g:any) => acc + g.keywords.length, 0)}</p>
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                    <strong>Sample Headline:</strong> {camp.adGroups[0].ads[0].headlines[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
