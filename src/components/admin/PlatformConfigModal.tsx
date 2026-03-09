'use client';

import { useState } from 'react';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';

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
    clerkKey: '',
    // Digistore24 Specific
    multiCurrency: false
  });
  const [loading, setLoading] = useState(false);

  const isClickBank = platform === 'ClickBank';
  const isDigistore = platform === 'Digistore24';

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

  // Only show validation for ClickBank specifically, others are direct sync
  const buttonText = loading 
    ? (isClickBank ? 'Validating Keys...' : 'Syncing...') 
    : (isClickBank ? 'Validate & Connect' : 'Save & Sync Scraper');

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
                <FormField>
                    <FormLabel>Account Nickname *</FormLabel>
                    <FormInput 
                        type="text" 
                        required
                        value={formData.affiliateId}
                        onChange={(e) => setFormData({...formData, affiliateId: e.target.value})}
                        placeholder="e.g. nickname123"
                    />
                </FormField>
                <FormField>
                    <FormLabel>Developer API Key *</FormLabel>
                    <FormInput 
                        type="password" 
                        required
                        value={formData.devKey}
                        onChange={(e) => setFormData({...formData, devKey: e.target.value})}
                        placeholder="DEV-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Account Settings -{'>'} My Account -{'>'} Developer API Keys</p>
                </FormField>
                <FormField>
                    <FormLabel>Clerk API Key *</FormLabel>
                    <FormInput 
                        type="password" 
                        required
                        value={formData.clerkKey}
                        onChange={(e) => setFormData({...formData, clerkKey: e.target.value})}
                        placeholder="API-..."
                    />
                     <p className="text-xs text-gray-500 mt-1">Required for Orders/Sales data validation.</p>
                </FormField>
            </>
          ) : (
            <>
                <FormField>
                    <FormLabel>Marketplace Feed URL *</FormLabel>
                    <FormInput 
                    type="url" 
                    required
                    value={formData.marketplaceUrl}
                    onChange={(e) => setFormData({...formData, marketplaceUrl: e.target.value})}
                    placeholder={`https://${platform.toLowerCase()}.com/marketplace/feed`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                    We will scrape this URL to find top products, Gravity, and Rank.
                    </p>
                </FormField>

                <FormField>
                    <FormLabel>Affiliate ID / Nickname</FormLabel>
                    <FormInput 
                    type="text" 
                    value={formData.affiliateId}
                    onChange={(e) => setFormData({...formData, affiliateId: e.target.value})}
                    placeholder="e.g. john123"
                    />
                </FormField>

                <FormField>
                    <FormLabel>API Key (Optional)</FormLabel>
                    <FormInput 
                    type="password" 
                    value={formData.apiKey}
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                    placeholder="••••••••••••"
                    />
                </FormField>

                {isDigistore && (
                    <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                        <input 
                            type="checkbox" 
                            id="multiCurrency"
                            checked={formData.multiCurrency}
                            onChange={(e) => setFormData({...formData, multiCurrency: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="multiCurrency" className="text-sm font-medium text-gray-700">
                            Enable Multi-Currency Tracking (USD, EUR, GBP)
                        </label>
                    </div>
                )}
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
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
