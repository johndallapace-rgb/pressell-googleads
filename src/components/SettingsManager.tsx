'use client';

import { useState } from 'react';
import { CampaignConfig } from '@/lib/config';

export default function SettingsManager({ initialConfig, readOnly = false }: { initialConfig: CampaignConfig, readOnly?: boolean }) {
  const [config, setConfig] = useState<CampaignConfig>(initialConfig);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const productKeys = Object.keys(config.products);

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold">Global Settings</h2>
        <div className="flex items-center space-x-4">
           {readOnly && (
             <span className="text-amber-600 font-bold px-2 py-1 bg-amber-50 rounded border border-amber-200 text-sm">
               Read Only Mode (Missing Env Vars)
             </span>
           )}
           {status === 'success' && (
             <span className="text-green-600 font-bold px-2 py-1 bg-green-50 rounded">Saved!</span>
           )}
           <button 
            onClick={handleSave}
            disabled={status === 'saving' || readOnly}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 font-bold"
          >
            {status === 'saving' ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Active Product Slug</label>
          <p className="text-xs text-gray-500 mb-2">The product that will be shown on the home page (/).</p>
          <select 
            value={config.active_product_slug}
            onChange={e => setConfig({...config, active_product_slug: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            {productKeys.map(slug => (
              <option key={slug} value={slug}>{config.products[slug].name} ({slug})</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
