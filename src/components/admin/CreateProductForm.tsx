'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAffiliateId } from '@/lib/affiliate-mapping';
import productCatalog from '@/data/product-catalog.json';
import negativeKeywords from '@/data/negative-keywords.json';

export default function CreateProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Platform Context
  const importedPlatform = searchParams.get('platform');
  const importUrlParam = searchParams.get('import');
  const catalogId = searchParams.get('catalogId');
  const catalogSlug = searchParams.get('catalogSlug');
  
  const [platformId, setPlatformId] = useState('');

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
    google_ads_descriptions: [] as string[],
    google_ads_negatives: [] as string[]
  });

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [variantStrategy, setVariantStrategy] = useState<'standard' | 'pain' | 'dream'>('standard');
  const [competitorAds, setCompetitorAds] = useState('');

  // Auto-fill from Catalog & Params
  useEffect(() => {
    // 1. Auto-fill from Catalog ID if present
    if (catalogId && catalogSlug) {
         // @ts-ignore
         const catalogItem = productCatalog.products[catalogSlug];
         if (catalogItem) {
             setFormData(prev => ({
                 ...prev,
                 affiliate_url: `${catalogItem.base_url}/${catalogItem.id}/${catalogItem.vendor}`,
                 google_ads_id: catalogItem.google_ads_id || prev.google_ads_id,
                 google_ads_label: catalogItem.google_ads_label || prev.google_ads_label
             }));
             setMessage({ type: 'success', text: `⚡ Industrial Mode: ID ${catalogItem.id} injected from Catalog.` });
         }
    }

    // 2. Handle Import Param (Auto-Scrape)
    if (importUrlParam && !importing && !importUrl) {
        setImportUrl(importUrlParam);
        // Removed auto-click to allow manual control as requested
    }
  }, [catalogId, catalogSlug, importUrlParam]);

  // Auto-fill Affiliate ID if Platform detected
  useEffect(() => {
      if (importedPlatform) {
          const defaultId = getAffiliateId(importedPlatform);
          if (defaultId) {
              setPlatformId(defaultId);
              setMessage({ type: 'success', text: `✅ ${importedPlatform} Detected. Affiliate ID: ${defaultId} (Auto-filled)` });
          }
      }
  }, [importedPlatform]);

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
              language: data.detected_language || prev.language, // Auto-set language
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
          
          const langName = data.detected_language === 'pt' ? 'Portuguese' : 
                           data.detected_language === 'de' ? 'German' : 
                           data.detected_language === 'es' ? 'Spanish' : 
                           data.detected_language === 'fr' ? 'French' : 'English';

          setMessage({ type: 'success', text: `✨ Analyzed! Detected Market: ${langName.toUpperCase()}. Content generated natively.` });
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

  const handleLoadNegatives = (e: React.MouseEvent) => {
      e.preventDefault();
      const lang = formData.language || 'en';
      
      // Determine key based on language (fallback to EN)
      const key = (lang === 'de' || lang === 'fr' || lang === 'pt' || lang === 'es') ? lang : 'en';
      
      // @ts-ignore
      const list = negativeKeywords[key] || negativeKeywords['en'];
      
      setFormData(prev => ({
          ...prev,
          google_ads_negatives: list
      }));
      
      setMessage({ type: 'success', text: `✅ Loaded ${list.length} Standard Negative Keywords for ${lang.toUpperCase()}.` });
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
      // Validations
      // Auto-generate slug if missing
      const cleanProduct = { ...formData };
      if (!cleanProduct.slug && cleanProduct.name) {
          cleanProduct.slug = cleanProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      if (!cleanProduct.slug) throw new Error('Slug is required (or Name to generate it)');
      if (!/^[a-z0-9-]+$/.test(cleanProduct.slug)) throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');

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
        body: JSON.stringify(cleanProduct)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setMessage({ type: 'success', text: `Product created successfully! Redirecting to My Products...` });
      
      // Open Presell in new tab for verification
      window.open(`/${data.slug}`, '_blank');
      
      // Redirect to My Products List
      setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
      }, 1500);

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
            🚀 Scale New Product with AI
          </h3>
          <p className="text-sm text-purple-600 mb-3">
             Paste the official sales page URL below. The AI will analyze the copy, extract pain points, find images, and auto-configure the presell + Google Ads.
          </p>
          <div className="flex gap-2 mb-3">
              <input 
                type="url" 
                value={importUrl}
                onChange={handleImportUrlChange}
                placeholder="https://official-product-site.com"
                className="flex-1 border rounded px-3 py-2 text-base text-black placeholder:text-gray-500 selection:bg-purple-200 selection:text-black"
              />
              <button 
                id="auto-import-btn"
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

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Basic Data */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Step 1</span>
                Basic Identity
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name *</label>
                  <input 
                    type="text" name="name" required
                    value={formData.name} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black text-lg font-medium"
                    placeholder="Ex: Mitolyn"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Slug (URL ID)</label>
                  <input 
                    type="text" name="slug"
                    value={formData.slug} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black font-mono text-sm"
                    placeholder="mitolyn (auto-generated)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                    <select 
                        name="vertical" value={formData.vertical} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black bg-white"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select 
                        name="language" value={formData.language} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black bg-white"
                    >
                        <option value="en">English 🇺🇸</option>
                        <option value="pt">Portuguese 🇧🇷</option>
                        <option value="es">Spanish 🇪🇸</option>
                        <option value="fr">French 🇫🇷</option>
                        <option value="de">German 🇩🇪</option>
                        <option value="it">Italian 🇮🇹</option>
                    </select>
                   </div>
                </div>
            </div>
        </div>

        {/* Step 2: Critical Links */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Step 2</span>
                Money Links (Critical)
            </h3>
            
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Affiliate URL (Commission Link) *</label>
                  <div className="relative">
                    <input 
                        type="url" name="affiliate_url" required
                        value={formData.affiliate_url} onChange={handleChange}
                        className={`w-full border-2 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none text-black font-mono text-sm ${!formData.affiliate_url ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}
                        placeholder={importedPlatform === 'Digistore24' ? `https://www.digistore24.com/redir/PRODUCT_ID/${platformId || 'AFFILIATE_ID'}` : "https://hop.clickbank.net/..."}
                    />
                  </div>
                  {!formData.affiliate_url && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">⚠️ REQUIRED TO ENABLE CREATION</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Official Site URL</label>
                      <input 
                        type="url" name="official_url" required
                        value={formData.official_url} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                        placeholder="https://product.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Review URL</label>
                      <input 
                        type="url" name="youtube_review_url" required
                        value={formData.youtube_review_url} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                </div>
            </div>
        </div>

        {/* Step 3: Intelligence & Tracking */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Step 3</span>
                Intelligence & Safety
            </h3>

            {/* Competitor Spy Field */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                    🕵️ Competitor Copy (Ad Spy)
                </h3>
                <textarea
                    value={competitorAds}
                    onChange={(e) => setCompetitorAds(e.target.value)}
                    placeholder="Paste ad copy, headlines, or keywords from competitors here..."
                    className="w-full border rounded p-2 text-sm h-20 text-black placeholder:text-gray-400"
                />
            </div>

            {/* Negative Keywords Section - Highlighted */}
            <div className="bg-red-50 p-5 rounded-lg border border-red-100 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                        ⛔ Negative Keywords (Traffic Filter)
                    </h3>
                    <button 
                        onClick={handleLoadNegatives}
                        className="text-xs bg-white border border-red-200 hover:bg-red-100 text-red-700 px-3 py-1 rounded font-bold transition-colors shadow-sm"
                    >
                        📥 Load Standards
                    </button>
                </div>
                <textarea
                    value={formData.google_ads_negatives.join('\n')}
                    onChange={(e) => setFormData(prev => ({ ...prev, google_ads_negatives: e.target.value.split('\n') }))}
                    placeholder="free, login, support, crack..."
                    className="w-full border border-red-200 rounded p-2 text-sm h-24 text-black placeholder:text-red-300 font-mono bg-white focus:ring-2 focus:ring-red-500 outline-none"
                />
                <p className="text-xs text-red-600 mt-1 font-medium">Filtering these keywords saves 30-40% of budget.</p>
            </div>

            {/* Tracking */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Ads Pixel ID</label>
                    <input 
                        type="text" name="google_ads_id"
                        value={formData.google_ads_id} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conversion Label</label>
                    <input 
                        type="text" name="google_ads_label"
                        value={formData.google_ads_label} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black font-mono text-sm"
                    />
                </div>
            </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t flex justify-end sticky bottom-0 bg-white/90 p-4 backdrop-blur-sm border-t-gray-200 z-10">
           <button 
             type="submit" 
             disabled={loading || !formData.affiliate_url}
             className={`px-8 py-4 bg-black text-white font-black text-lg rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center gap-3 ${loading || !formData.affiliate_url ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
           >
             {loading ? 'Creating Product...' : (
                <>
                    <span>🚀</span> CREATE PRODUCT
                </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
