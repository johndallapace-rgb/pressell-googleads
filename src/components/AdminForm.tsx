'use client';

import { useState, useEffect } from 'react';
import { CampaignConfig } from '@/lib/config';

// Define type for config status
type ConfigMode = 'edge' | 'env';

export default function AdminForm({ initialConfig }: { initialConfig: CampaignConfig }) {
  const [config, setConfig] = useState<CampaignConfig>(initialConfig);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Helper to update product config
  const updateProduct = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      products: {
        ...prev.products,
        mitolyn: {
          ...prev.products.mitolyn,
          [key]: value
        }
      }
    }));
  };

  const handleYoutubeChange = (input: string) => {
    // Simple extractor for youtube ID
    let id = input;
    try {
      const url = new URL(input);
      if (url.hostname.includes('youtube.com')) {
        id = url.searchParams.get('v') || id;
      } else if (url.hostname.includes('youtu.be')) {
        id = url.pathname.slice(1) || id;
      }
    } catch {
      // Not a URL, assume ID
    }
    updateProduct('youtube_review_id', id);
  };

  const handleSave = async () => {
    setStatus('saving');
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (res.ok) {
        setStatus('success');
        // Optional: Open presell logic could be here
        setTimeout(() => setStatus('idle'), 3000); // Reset status
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold">Campaign Configuration</h2>
        <div className="flex space-x-2">
           {status === 'success' && (
             <span className="text-green-600 font-bold px-2 py-1 bg-green-50 rounded">Saved!</span>
           )}
        </div>
      </div>
      
      {status === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">
            Error saving settings. Check if VERCEL_API_TOKEN is configured.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Default Language</label>
        <input 
          type="text" 
          value={config.default_lang}
          onChange={e => setConfig({...config, default_lang: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Active Product Slug</label>
        <input 
          type="text" 
          value={config.active_product_slug}
          onChange={e => setConfig({...config, active_product_slug: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-lg mb-4">Product: Mitolyn</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Affiliate URL (Outbound)</label>
            <input 
              type="url" 
              value={config.products.mitolyn.affiliate_url}
              onChange={e => updateProduct('affiliate_url', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">Used for redirects via /api/out</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Official URL (Fallback/Welcome)</label>
            <input 
              type="url" 
              value={config.products.mitolyn.official_url}
              onChange={e => updateProduct('official_url', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube Review ID (or URL)</label>
            <input 
              type="text" 
              value={config.products.mitolyn.youtube_review_id}
              onChange={e => handleYoutubeChange(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g. PSd-VG31tcE or full youtube url"
            />
            <p className="text-xs text-gray-500 mt-1">Current ID: {config.products.mitolyn.youtube_review_id}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button 
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Settings'}
        </button>
        
        <a 
          href={`/${config.active_product_slug}`}
          target="_blank"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Open Presell &rarr;
        </a>
      </div>
    </div>
  );
}
