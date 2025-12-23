'use client';

import { useState } from 'react';
import { CampaignConfig, updateCampaignConfig } from '@/lib/config';

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

  const handleSave = async () => {
    setStatus('saving');
    // Call server action or API. Since we are in app router, we can use a server action if defined, 
    // but here I'll just use a simple API route or call the function if it was a server action. 
    // However, updateCampaignConfig uses fetch to Vercel API, which can be done from client or server. 
    // Better to do it server side to hide tokens.
    
    // I will assume I need to create an API route for updating config to keep tokens safe.
    // Let's assume /api/admin/config route exists.
    
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h2 className="text-xl font-bold">Campaign Configuration</h2>
      
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
              type="text" 
              value={config.products.mitolyn.affiliate_url}
              onChange={e => updateProduct('affiliate_url', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Official URL (Fallback/Welcome)</label>
            <input 
              type="text" 
              value={config.products.mitolyn.official_url}
              onChange={e => updateProduct('official_url', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube Review ID</label>
            <input 
              type="text" 
              value={config.products.mitolyn.youtube_review_id}
              onChange={e => updateProduct('youtube_review_id', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Configuration'}
        </button>
        {status === 'success' && <span className="ml-4 text-green-600">Saved successfully!</span>}
        {status === 'error' && <span className="ml-4 text-red-600">Error saving. Check logs.</span>}
      </div>
    </div>
  );
}
