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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Default Language</label>
          <p className="text-xs text-gray-500 mb-2">Fallback language for the platform.</p>
          <select 
            value={config.default_lang}
            onChange={e => setConfig({...config, default_lang: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
    </div>
  );
}
