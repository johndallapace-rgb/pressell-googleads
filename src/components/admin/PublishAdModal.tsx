import React, { useState, useEffect } from 'react';

interface PublishAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (customerId: string, campaignId: string, adGroupId: string) => Promise<void>;
  productName: string;
}

interface Resource {
    id: string;
    name: string;
}

export default function PublishAdModal({ isOpen, onClose, onPublish, productName }: PublishAdModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [customers, setCustomers] = useState<Resource[]>([]);
  const [campaigns, setCampaigns] = useState<Resource[]>([]);
  const [adGroups, setAdGroups] = useState<Resource[]>([]);

  // Selection
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedAdGroup, setSelectedAdGroup] = useState('');

  useEffect(() => {
    if (isOpen) {
        loadCustomers();
    } else {
        // Reset state on close
        setStep(1);
        setSelectedCustomer('');
        setSelectedCampaign('');
        setSelectedAdGroup('');
        setCustomers([]);
        setCampaigns([]);
        setAdGroups([]);
        setError('');
    }
  }, [isOpen]);

  const loadCustomers = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/ads/google/resources?type=customers');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setCustomers(data);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const loadCampaigns = async (cid: string) => {
      setLoading(true);
      try {
          const res = await fetch(`/api/admin/ads/google/resources?type=campaigns&customerId=${cid}`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setCampaigns(data);
          setStep(2);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const loadAdGroups = async (cid: string, cmpId: string) => {
      setLoading(true);
      try {
          const res = await fetch(`/api/admin/ads/google/resources?type=adgroups&customerId=${cid}&campaignId=${cmpId}`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setAdGroups(data);
          setStep(3);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cid = e.target.value;
      setSelectedCustomer(cid);
      if (cid) loadCampaigns(cid);
  };

  const handleCampaignSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cmpId = e.target.value;
      setSelectedCampaign(cmpId);
      if (cmpId) loadAdGroups(selectedCustomer, cmpId);
  };

  const handlePublishClick = async () => {
      if (!selectedCustomer || !selectedCampaign || !selectedAdGroup) return;
      setLoading(true);
      try {
          await onPublish(selectedCustomer, selectedCampaign, selectedAdGroup);
          onClose();
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🚀 Publish to Google Ads
        </h3>
        <p className="text-sm text-gray-500 mb-6">
            Publishing ads for <strong>{productName}</strong>. Select the destination.
        </p>

        {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                {error}
            </div>
        )}

        <div className="space-y-4">
            {/* Step 1: Account */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Ads Account</label>
                <select 
                    className="w-full border rounded p-2"
                    value={selectedCustomer}
                    onChange={handleCustomerSelect}
                    disabled={loading || customers.length === 0}
                >
                    <option value="">Select Account...</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                </select>
            </div>

            {/* Step 2: Campaign */}
            {step >= 2 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                    <select 
                        className="w-full border rounded p-2"
                        value={selectedCampaign}
                        onChange={handleCampaignSelect}
                        disabled={loading}
                    >
                        <option value="">Select Campaign...</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Step 3: AdGroup */}
            {step >= 3 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Group</label>
                    <select 
                        className="w-full border rounded p-2"
                        value={selectedAdGroup}
                        onChange={(e) => setSelectedAdGroup(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">Select Ad Group...</option>
                        {adGroups.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                disabled={loading}
            >
                Cancel
            </button>
            <button 
                onClick={handlePublishClick}
                disabled={!selectedAdGroup || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? 'Publishing...' : 'Confirm & Publish'}
            </button>
        </div>
      </div>
    </div>
  );
}
