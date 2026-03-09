import React, { useState, useEffect } from 'react';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';

interface PushCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string;
  productName: string;
  initialAds?: { headlines: string[], descriptions: string[] };
}

interface Resource {
    id: string;
    name: string;
}

export default function PushCampaignModal({ isOpen, onClose, productSlug, productName, initialAds }: PushCampaignModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Resource[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Local Ad State (Editable)
  const [ads, setAds] = useState({ headlines: [] as string[], descriptions: [] as string[] });

  useEffect(() => {
    if (isOpen) {
        loadCustomers();
        setResult(null);
        setError('');
        
        // Load passed ads or defaults
        if (initialAds) {
            setAds(initialAds);
        }
    }
  }, [isOpen, initialAds]);

  const loadCustomers = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/ads/google/resources?type=customers');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setCustomers(data);
          // Auto-select if only one
          if (data.length === 1) setSelectedCustomer(data[0].id);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleLaunch = async () => {
      if (!selectedCustomer) return;
      setLoading(true);
      setError('');
      
      try {
          // Explicitly pass productKey as alias for productSlug if backend expects it or for clarity
          const payload = {
              customerId: selectedCustomer,
              productSlug: productSlug,
              productKey: productSlug, // Added as requested fallback
              adsData: ads
          };

          const res = await fetch('/api/admin/google-ads/create-campaign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create campaign');
          
          setResult(data);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
            🚀 Push to Google Ads
        </h3>
        
        {!result ? (
            <>
                <p className="text-sm text-gray-600 mb-6">
                    You are about to create a new Search Campaign for <strong>{productName}</strong>.
                    <br/>
                    This will create:
                    <ul className="list-disc list-inside mt-2 text-xs text-gray-500">
                        <li>Campaign: <strong>[AUTO] {productName} - {new Date().toLocaleDateString()}</strong></li>
                        <li>Budget: <strong>$50.00/day</strong></li>
                        <li>Ad Group: <strong>General Interest</strong></li>
                        <li>Keywords: <strong>Brand + Reviews</strong></li>
                        <li>Ads: <strong>{ads.headlines.length} Headlines / {ads.descriptions.length} Descriptions</strong></li>
                    </ul>
                </p>

                {/* Ads Preview / Validation */}
                <div className="mb-4 p-3 bg-gray-50 rounded border text-xs">
                    <h4 className="font-bold text-gray-700 mb-2">Ad Assets Preview:</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="block font-semibold mb-1">Headlines ({ads.headlines.length}/15)</span>
                            <div className="max-h-24 overflow-y-auto">
                                {ads.headlines.map((h, i) => (
                                    <div key={i} className={`truncate ${h.length > 30 ? 'text-red-500' : 'text-gray-600'}`}>
                                        {h} ({h.length})
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="block font-semibold mb-1">Descriptions ({ads.descriptions.length}/4)</span>
                            <div className="max-h-24 overflow-y-auto">
                                {ads.descriptions.map((d, i) => (
                                    <div key={i} className={`truncate ${d.length > 90 ? 'text-red-500' : 'text-gray-600'}`}>
                                        {d} ({d.length})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <FormField>
                        <FormLabel className="text-gray-700">Select Google Ads Account</FormLabel>
                        <FormSelect 
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                            disabled={loading || customers.length === 0}
                            className="bg-gray-50"
                        >
                            <option value="">Select Account...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                            ))}
                        </FormSelect>
                    </FormField>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleLaunch}
                        disabled={!selectedCustomer || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </>
                        ) : '🚀 Launch Campaign'}
                    </button>
                </div>
            </>
        ) : (
            <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Campaign Launched!</h3>
                <p className="mt-2 text-sm text-gray-500">
                    Successfully created campaign, ad group, and ads.
                </p>
                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
