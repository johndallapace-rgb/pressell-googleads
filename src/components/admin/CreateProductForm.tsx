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
  const importUrlParam = searchParams.get('import') || searchParams.get('url'); // Handle 'url' from Market Trends
  const nicheParam = searchParams.get('niche');
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
        setFormData(prev => ({ 
            ...prev, 
            official_url: importUrlParam,
            vertical: nicheParam ? nicheParam.toLowerCase() : prev.vertical, // Pre-select Niche
            affiliate_url: prev.affiliate_url || 'https://hop.clickbank.net/?affiliate=johnpace&vendor=VENDOR_ID', // Default JohnPace placeholder
            google_ads_id: prev.google_ads_id || '17850696537' // Default Pixel ID for Scale
        }));
        
        if (nicheParam) {
            setMessage({ type: 'success', text: `🚀 Ready to Launch: ${nicheParam} Product Detected. Please verify Affiliate Link.` });
        }
    }
  }, [catalogId, catalogSlug, importUrlParam, nicheParam]);

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

  // Removed unused handlers (handleLoadNegatives, handlePreSubmit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Direct Validation
    if (!formData.affiliate_url) {
         setMessage({ type: 'error', text: '⛔ Critical: Affiliate URL is required!' });
         setLoading(false);
         return;
    }
    
    if (!formData.official_url) {
         setMessage({ type: 'error', text: '⛔ Critical: Official Product URL is required for AI Analysis!' });
         setLoading(false);
         return;
    }

    try {
      // 1. Auto-extract Name if missing
      let productName = formData.name;
      if (!productName) {
          try {
              const urlObj = new URL(formData.official_url);
              // Try to guess from hostname or path
              // ex: prodentim.com -> prodentim
              // ex: site.com/prodentim -> prodentim
              let guess = urlObj.hostname.split('.')[0];
              if (guess === 'www' || guess === 'get' || guess === 'try') {
                  guess = urlObj.hostname.split('.')[1];
              }
              if (guess.length < 3) {
                  // Fallback to path
                  const pathPart = urlObj.pathname.split('/')[1];
                  if (pathPart) guess = pathPart;
              }
              productName = guess.charAt(0).toUpperCase() + guess.slice(1);
          } catch (e) {
              productName = 'New Product';
          }
      }

      console.log('🚀 [Direct Auto-Create] Launching...', { 
          importUrl: formData.official_url,
          name: productName,
          country: formData.language.toUpperCase() 
      });

      // 1. Direct Auto-Create Call (Simplified Flow)
      // This endpoint handles Scraping -> AI -> Image -> Saving in one go
      const res = await fetch('/api/admin/products/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            importUrl: formData.official_url,
            name: productName,
            competitorAds: competitorAds,
            country: formData.language.toUpperCase() // e.g. "EN" -> "EN"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to auto-create product');
      }

      // 2. Post-Save Update: Inject Critical Manual Fields
      // Since auto-create might miss the affiliate link or pixel if not in catalog,
      // we do a quick patch to ensure they are set.
      if (data.slug) {
          console.log('[CLIENT-DEBUG] Patching manual fields for:', data.slug);
          const updateRes = await fetch('/api/admin/products/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  product: {
                      slug: data.slug, // Key to find it
                      affiliate_url: formData.affiliate_url,
                      google_ads_id: formData.google_ads_id,
                      google_ads_label: formData.google_ads_label,
                      vertical: data.vertical || formData.vertical // Ensure vertical is consistent
                      // We only send fields we want to merge/overwrite
                  } 
              })
          });
          if (!updateRes.ok) console.warn('Failed to patch manual fields, but product created.');
      }

      setMessage({ type: 'success', text: `Product created successfully! Redirecting to My Products...` });
      
      // Open Presell in new tab with CORRECT Subdomain
      const rootDomain = 'topproductofficial.com';
      let finalUrl = `https://${rootDomain}/${data.slug}`;
      
      // If we have a vertical and it's not generic, use subdomain
      if (data.vertical && data.vertical !== 'other' && data.vertical !== 'general') {
          finalUrl = `https://${data.vertical}.${rootDomain}/${data.slug}`;
      }

      window.open(finalUrl, '_blank');
      
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8 relative">
      
      {/* NO POPUP - Direct Action */}
      
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

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Simplified Auto-Pilot Interface */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg text-center">
            
            <div className="mb-8">
                <h3 className="text-3xl font-black text-gray-900 mb-2">🚀 New Pre-sell Auto-Pilot</h3>
                <p className="text-gray-500 text-lg">Paste the links below and let Gemini build the entire high-converting page for you.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6 text-left">
                
                {/* 1. Official URL (Source of Truth) */}
                <div>
                    <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span>🌐</span> Official Product Page URL
                        <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">AI Source</span>
                    </label>
                    <input 
                        type="url" 
                        value={formData.official_url}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, official_url: val }));
                            setImportUrl(val); // Sync for AI
                        }}
                        placeholder="https://official-product-site.com"
                        className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                </div>

                {/* 2. Affiliate URL (Money Link) */}
                <div>
                    <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span>💰</span> Your Affiliate Link (JohnPace)
                        <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Commission Target</span>
                    </label>
                    <input 
                        type="url" 
                        value={formData.affiliate_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, affiliate_url: e.target.value }))}
                        placeholder="https://hop.clickbank.net/?affiliate=johnpace..."
                        className={`w-full border-2 rounded-xl px-5 py-4 text-xl font-mono text-black outline-none transition-all ${!formData.affiliate_url ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-green-300 bg-green-50 focus:border-green-500'}`}
                    />
                    {!formData.affiliate_url && (
                        <p className="text-red-600 font-bold mt-2 animate-pulse flex items-center gap-2">
                            ⚠️ Required: Paste your commission link to unlock the button.
                        </p>
                    )}
                </div>

                {/* 3. Pixel ID (Tracking) */}
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        Google Ads Pixel ID (Optional)
                    </label>
                    <input 
                        type="text" 
                        value={formData.google_ads_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, google_ads_id: e.target.value }))}
                        placeholder="AW-XXXXXXXX"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>

            </div>

            {/* Action Area */}
            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col gap-4">
                
                {/* 1. Dry Run / Route Test Button */}
                <button 
                    type="button"
                    onClick={async (e) => {
                        e.preventDefault();
                        if (!formData.official_url || !formData.affiliate_url) {
                            setMessage({ type: 'error', text: 'URLs are required for Dry Run.' });
                            return;
                        }
                        
                        setLoading(true);
                        try {
                            // Manual save without AI
                            let name = formData.name;
                            if (!name) {
                                try {
                                    const u = new URL(formData.official_url);
                                    const parts = u.hostname.split('.');
                                    name = (parts.length > 2 ? parts[1] : parts[0]);
                                    name = name.charAt(0).toUpperCase() + name.slice(1);
                                } catch { name = 'Test Product'; }
                            }

                            const res = await fetch('/api/admin/products', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...formData,
                                    name,
                                    headline: 'Route Test Successful',
                                    subheadline: 'This is a placeholder content to verify domain routing.',
                                    bullets: ['Route Active', 'KV Connected', 'Ready for AI'],
                                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                })
                            });
                            
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            
                            setMessage({ type: 'success', text: `Dry Run Saved! Slug: ${data.slug}. Check 'My Products' for status.` });
                            
                            setTimeout(() => {
                                router.push('/admin/products');
                                router.refresh();
                            }, 1500);

                        } catch (e: any) {
                            setMessage({ type: 'error', text: e.message });
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="w-full max-w-2xl mx-auto py-3 bg-gray-100 border-2 border-gray-300 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                    🧪 SAVE FOR ROUTE TESTING (NO AI)
                </button>

                {/* 2. Main AI Button (UNLOCKED) */}
                <button 
                    type="submit"
                    disabled={loading || !formData.affiliate_url || !formData.official_url}
                    className="w-full max-w-2xl mx-auto py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-2xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            BUILDING PRE-SELL...
                        </>
                    ) : (
                        <>
                            <span>🚀</span> GENERATE PRE-SELL WITH GEMINI
                        </>
                    )}
                </button>
                <p className="text-gray-400 text-sm mt-4">
                    AI will auto-detect language, download images, and build the vertical layout.
                </p>
            </div>

        </div>

        {/* Hidden Fields for Compatibility */}
        <div className="hidden">
            <input type="text" name="name" value={formData.name} readOnly />
        </div>

      </form>
    </div>
  );
}
