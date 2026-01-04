'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    vertical: 'health',
    language: 'en',
    template: 'editorial',
    affiliate_url: '',
    official_url: '',
    youtube_review_url: '',
    status: 'active',
    set_as_active: false,
    // AI Content
    headline: '',
    subheadline: '',
    bullets: [] as string[],
    pain_points: [] as string[],
    unique_mechanism: '',
    image_url: '',
    seo: null as any,
    // Tracking
    google_ads_id: '17850696537', // Default for scale
    google_ads_label: '',
    support_email: 'support@topproductofficial.com',
    // Generated Ads
    google_ads_headlines: [] as string[],
    google_ads_descriptions: [] as string[]
  });

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [variantStrategy, setVariantStrategy] = useState<'standard' | 'pain' | 'dream'>('standard');

  // Sync import URL to Official URL automatically
  const handleImportUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setImportUrl(url);
      setFormData(prev => ({ ...prev, official_url: url }));
  };

  const handleImport = async () => {
      if (!importUrl) return;
      
      // Sync immediately so user doesn't lose the URL if import fails
      setFormData(prev => ({ ...prev, official_url: importUrl }));
      
      setImporting(true);
      setMessage(null);
      try {
          const res = await fetch('/api/admin/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  official_url: importUrl,
                  strategy: variantStrategy 
              })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          setFormData(prev => ({
              ...prev,
              name: data.name || prev.name,
              vertical: data.vertical || prev.vertical,
              official_url: importUrl, // Ensure it stays set
              headline: data.headline_suggestions?.[0] || '',
              subheadline: data.subheadline_suggestions?.[0] || '',
              bullets: data.bullets_suggestions || [],
              pain_points: data.pain_points || [],
              unique_mechanism: data.unique_mechanism || '',
              image_url: data.image_url || '',
              seo: data.seo || prev.seo,
              google_ads_headlines: data.google_ads?.headlines || [],
              google_ads_descriptions: data.google_ads?.descriptions || []
          }));
          setMessage({ type: 'success', text: '✨ Analyzed, Vertical Detected & Ads Generated!' });
      } catch (e: any) {
          console.error(e);
          setMessage({ type: 'error', text: 'Import failed: ' + e.message });
      } finally {
          setImporting(false);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 0. Strict Validation (Safety Lock)
    if (!formData.affiliate_url || !formData.affiliate_url.startsWith('http')) {
        setLoading(false);
        setMessage({ type: 'error', text: '⛔ Critical: Affiliate URL is required to make money!' });
        // Scroll to top
        window.scrollTo(0, 0);
        return;
    }

    if (!formData.youtube_review_url || !formData.youtube_review_url.startsWith('http')) {
        setLoading(false);
        setMessage({ type: 'error', text: '⛔ Critical: YouTube Review is required for conversion!' });
        window.scrollTo(0, 0);
        return;
    }

    try {
      // Get token from localStorage (as per existing admin login logic)
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Unauthorized: Please login again' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setMessage({ type: 'success', text: `Product created successfully: ${data.slug}` });
      
      // Open Presell in new tab
      window.open(`/${data.slug}`, '_blank');
      
      // Refresh router to show update in list (if displayed)
      router.refresh();

      // Optional: Clear form or redirect
      // setFormData({ ... });

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Create New Product</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg border flex items-start shadow-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <div>
            <p className="font-medium">{message.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-sm mt-1 opacity-90">{message.text}</p>
          </div>
        </div>
      )}

      {/* Quick Scale / Import */}
      <div className="mb-8 bg-purple-50 p-4 rounded border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            🚀 Scale New Product with AI (Gemini)
          </h3>
          <p className="text-sm text-purple-600 mb-3">
             Paste the official sales page URL below. Gemini will analyze the copy, extract pain points, find images, and auto-configure the presell + Google Ads.
          </p>
          <div className="flex gap-2 mb-3">
              <input 
                type="url" 
                value={importUrl}
                onChange={handleImportUrlChange}
                placeholder="https://official-product-site.com"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button 
                onClick={handleImport}
                disabled={importing || !importUrl}
                className="bg-purple-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    <>
                        <span>✨</span> Generate Pre-sell
                    </>
                )}
              </button>
          </div>
          
          {/* Strategy Selector */}
          <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="radio" 
                      name="strategy" 
                      checked={variantStrategy === 'standard'}
                      onChange={() => setVariantStrategy('standard')}
                      className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Standard</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="radio" 
                      name="strategy" 
                      checked={variantStrategy === 'pain'}
                      onChange={() => setVariantStrategy('pain')}
                      className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-red-800 font-medium">Focus: Pain (A)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="radio" 
                      name="strategy" 
                      checked={variantStrategy === 'dream'}
                      onChange={() => setVariantStrategy('dream')}
                      className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-green-800 font-medium">Focus: Dream (B)</span>
              </label>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formData.google_ads_headlines.length > 0 && (
            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">📢 Generated Google Ads Copy</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 uppercase mb-1">Headlines</h4>
                        <ul className="list-disc pl-4 text-sm text-blue-800">
                            {formData.google_ads_headlines.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 uppercase mb-1">Descriptions</h4>
                        <ul className="list-disc pl-4 text-sm text-blue-800">
                            {formData.google_ads_descriptions.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    </div>
                </div>
                <p className="text-xs text-blue-500 mt-2">These will be saved to the Ads Manager automatically.</p>
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input 
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                placeholder="Ex: Mitolyn"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Optional)</label>
              <input 
                type="text" name="slug"
                value={formData.slug} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                placeholder="Ex: mitolyn (auto-generated if empty)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vertical *</label>
                <select 
                    name="vertical" value={formData.vertical} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white shadow-sm"
                >
                    <option value="health">Health</option>
                    <option value="diy">DIY</option>
                    <option value="pets">Pets</option>
                    <option value="dating">Dating</option>
                    <option value="finance">Finance</option>
                    <option value="other">Other</option>
                </select>
               </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
                <select 
                    name="language" value={formData.language} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white shadow-sm"
                >
                    <option value="en">English (en)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="it">Italian (it)</option>
                </select>
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
               <select 
                   name="template" value={formData.template} onChange={handleChange}
                   className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white shadow-sm"
               >
                   <option value="editorial">Editorial (Recommended)</option>
                   <option value="story">Story</option>
                   <option value="comparison">Comparison</option>
               </select>
            </div>
          </div>

          {/* URLs & Media */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate URL *</label>
              <input 
                type="url" name="affiliate_url" required
                value={formData.affiliate_url} onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm ${!formData.affiliate_url ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="https://hop.clickbank.net/..."
              />
              {!formData.affiliate_url && <p className="text-xs text-red-600 mt-1 font-bold">⚠️ Commission Link Missing!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Site URL *</label>
              <input 
                type="url" name="official_url" required
                value={formData.official_url} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                placeholder="https://product.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Review URL *</label>
              <input 
                type="url" name="youtube_review_url" required
                value={formData.youtube_review_url} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-1">Required for high conversion. We extract the ID automatically.</p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" name="set_as_active"
                    checked={formData.set_as_active} onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">Set as Active Product (Root)</span>
               </label>
            </div>
          </div>
        </div>

        {/* Tracking Section */}
        <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Tracking Configuration</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Ads Pixel ID</label>
                    <input 
                        type="text" name="google_ads_id"
                        value={formData.google_ads_id} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                        placeholder="AW-XXXXXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 17850696537 (Mitolyn Account)</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conversion Label</label>
                    <input 
                        type="text" name="google_ads_label"
                        value={formData.google_ads_label} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                        placeholder="e.g. DPCoCMK5h9wbENmG8L9C"
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Email (Public)</label>
                    <input 
                        type="email" name="support_email"
                        value={formData.support_email} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
                        placeholder="support@topproductofficial.com"
                    />
                </div>
            </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
           <button 
             type="submit" 
             disabled={loading}
             className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {loading ? 'Creating...' : 'Create Product'}
           </button>
        </div>
      </form>
    </div>
  );
}
