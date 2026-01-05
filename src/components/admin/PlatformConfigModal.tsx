'use client';

import { useState } from 'react';

interface PlatformConfigModalProps {
  platform: string;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function PlatformConfigModal({ platform, onClose, onSave }: PlatformConfigModalProps) {
  const [formData, setFormData] = useState({
    marketplaceUrl: '',
    affiliateId: '',
    apiKey: '',
    // ClickBank Specific
    devKey: '',
    clerkKey: ''
  });
  const [loading, setLoading] = useState(false);

  const isClickBank = platform === 'ClickBank';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await onSave(formData);
        onClose();
    } catch (e) {
        console.error(e);
        // Alert handled in parent usually, but good to have safety
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Configure {platform}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isClickBank ? (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Nickname *</label>
                    <input 
                        type="text" 
                        required
                        value={formData.affiliateId}
                        onChange={(e) => setFormData({...formData, affiliateId: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        placeholder="e.g. nickname123"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Developer API Key *</label>
                    <input 
                        type="password" 
                        required
                        value={formData.devKey}
                        onChange={(e) => setFormData({...formData, devKey: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        placeholder="DEV-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Account Settings -{'>'} My Account -{'>'} Developer API Keys</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clerk API Key *</label>
                    <input 
                        type="password" 
                        required
                        value={formData.clerkKey}
                        onChange={(e) => setFormData({...formData, clerkKey: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        placeholder="API-..."
                    />
                     <p className="text-xs text-gray-500 mt-1">Required for Orders/Sales data validation.</p>
                </div>
            </>
          ) : (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Feed URL *</label>
                    <input 
                    type="url" 
                    required
                    value={formData.marketplaceUrl}
                    onChange={(e) => setFormData({...formData, marketplaceUrl: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder={`https://${platform.toLowerCase()}.com/marketplace/feed`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                    We will scrape this URL to find top products, Gravity, and Rank.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate ID / Nickname</label>
                    <input 
                    type="text" 
                    value={formData.affiliateId}
                    onChange={(e) => setFormData({...formData, affiliateId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="e.g. john123"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Optional)</label>
                    <input 
                    type="password" 
                    value={formData.apiKey}
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="••••••••••••"
                    />
                </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (isClickBank ? 'Validating Keys...' : 'Syncing...') : (isClickBank ? 'Validate & Connect' : 'Save & Sync Scraper')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
