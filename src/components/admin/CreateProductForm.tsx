'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAffiliateId } from '@/lib/affiliate-mapping';
import productCatalog from '@/data/product-catalog.json';
import negativeKeywords from '@/data/negative-keywords.json';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';

export default function CreateProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Platform Context
  const importedPlatform = searchParams.get('platform');
  const importUrlParam = searchParams.get('import') || searchParams.get('url'); // Handle 'url' from Market Trends
  const nicheParam = searchParams.get('niche');
  const affiliateUrlParam = searchParams.get('affiliate_url'); // Read affiliate_url from URL
  const nameParam = searchParams.get('name'); // Read name from URL
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
    video_url: '', // Renamed from youtube_review_url
    status: 'active',
    set_as_active: false,
    // AI Content
    headline: '',
    subheadline: '',
    bullets: [] as string[],
    pain_points: [] as string[],
    unique_mechanism: '',
    image_url: '',
    sales_page_image_url: '', // NEW
    digistore_product_id: '', // NEW: Manual override for Digistore24
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

  // Asset Library Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetModalType, setAssetModalType] = useState<'image' | 'video'>('image');
  const [targetField, setTargetField] = useState<'image_url' | 'sales_page_image_url' | 'video_url'>('image_url'); // Track which field to update
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);

  const fetchLibraryAssets = async () => {
      try {
          const res = await fetch('/api/admin/assets');
          const data = await res.json();
          if (Array.isArray(data)) setLibraryAssets(data);
      } catch (e) { console.error(e); }
  };

  const openAssetModal = (type: 'image' | 'video', field: 'image_url' | 'sales_page_image_url' | 'video_url') => {
      setAssetModalType(type);
      setTargetField(field);
      setShowAssetModal(true);
      fetchLibraryAssets();
  };

  // Auto-fill from Catalog & Params & KV (Asset Memory)
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
            name: nameParam || prev.name,
            official_url: importUrlParam,
            vertical: nicheParam ? nicheParam.toLowerCase() : prev.vertical, // Pre-select Niche
            affiliate_url: affiliateUrlParam || prev.affiliate_url || 'https://hop.clickbank.net/?affiliate=johnpace&vendor=VENDOR_ID', // Use param or fallback
            google_ads_id: prev.google_ads_id || '17850696537' // Default Pixel ID for Scale
        }));

                // 3. SMART FILL: Check ASSET LIBRARY for existing assets (Priority over Config)
                const checkAssets = async () => {
                     try {
                         // A. Fetch Library Assets (New System)
                         const resLib = await fetch('/api/admin/assets');
                         const libAssets = await resLib.json();
                         
                         // Try to match by name or slug
                         let targetSlug = nameParam?.toLowerCase().replace(/[^a-z0-9]/g, '');
                         if (!targetSlug && importUrlParam) {
                             try {
                                 const u = new URL(importUrlParam);
                                 targetSlug = u.hostname.split('.')[0].replace(/www|get|try/g, '');
                                 if (targetSlug.length < 3) targetSlug = u.hostname.split('.')[1];
                             } catch {}
                         }

                         if (targetSlug && Array.isArray(libAssets)) {
                             // Find assets for this product
                             const matchedAssets = libAssets.filter(a => 
                                 a.productId.includes(targetSlug!) || 
                                 a.productName.toLowerCase().includes(targetSlug!)
                             );

                             if (matchedAssets.length > 0) {
                                 // Sort by newest first
                                 matchedAssets.sort((a, b) => b.createdAt - a.createdAt);

                                 const bestImage = matchedAssets.find(a => a.type === 'image');
                                 const bestVideo = matchedAssets.find(a => a.type === 'video');

                                 if (bestImage || bestVideo) {
                                     console.log(`[Smart Fill] Found assets in Library for ${targetSlug}`, { bestImage, bestVideo });
                                     setFormData(prev => ({
                                         ...prev,
                                         image_url: bestImage?.url || prev.image_url,
                                         video_url: bestVideo?.url || prev.video_url
                                     }));
                                     setMessage({ type: 'success', text: `📂 Asset Library: Auto-filled from your saved gallery!` });
                                     return; // Stop here if found in library
                                 }
                             }
                         }

                         // B. Fallback to Config (Legacy System)
                         const res = await fetch('/api/admin/config');
                         const config = await res.json();
                         const products = config.products || {};
                         
                         if (targetSlug) {
                             const matchKey = Object.keys(products).find(k => k.includes(targetSlug!));
                             if (matchKey) {
                                 const p = products[matchKey];
                                 if (p.product_image_url || p.video_url || p.youtube_review_id) {
                                     setFormData(prev => ({
                                         ...prev,
                                         image_url: p.product_image_url || p.image_url || prev.image_url,
                                         video_url: p.video_url || (p.youtube_review_id ? `https://www.youtube.com/watch?v=${p.youtube_review_id}` : prev.video_url)
                                     }));
                                     setMessage({ type: 'success', text: `📂 Legacy Memory: Auto-filled from previous product settings.` });
                                 }
                             }
                         }
                     } catch (e) { console.error('Smart Fill failed', e); }
                };
                checkAssets();
        
        if (nicheParam) {
            setMessage({ type: 'success', text: `🚀 Ready to Launch: ${nicheParam} Product Detected. Please verify Affiliate Link.` });
        }
    }
  }, [catalogId, catalogSlug, importUrlParam, nicheParam, affiliateUrlParam, nameParam]);

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
    
    // Auto-fill official URL if missing (using affiliate as source)
    const officialUrlToUse = formData.official_url || formData.affiliate_url;

    try {
      // 1. Auto-extract Name if missing
      let productName = formData.name;
      if (!productName) {
          try {
              const urlObj = new URL(officialUrlToUse);
              // Try to guess from hostname or path
              // ex: prodentim.com -> prodentim
              // ex: site.com/prodentim -> prodentim
              let guess = urlObj.hostname.split('.')[0];
              if (guess === 'www' || guess === 'get' || guess === 'try') {
                  guess = urlObj.hostname.split('.')[1];
              }
              // If affiliate link (clickbank), this extraction is bad (hop.clickbank.net)
              // We rely on backend smart extraction or user should input name?
              // Let's rely on backend or simple fallback
              if (guess.includes('clickbank') || guess.includes('digistore')) {
                   guess = 'New Product';
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
          importUrl: officialUrlToUse,
          name: productName,
          country: formData.language.toUpperCase() 
      });

      // 1. Direct Auto-Create Call (Simplified Flow)
      // This endpoint handles Scraping -> AI -> Image -> Saving in one go
      const res = await fetch('/api/admin/products/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            importUrl: officialUrlToUse, // Send affiliate link as importUrl if official is missing
            name: productName,
            competitorAds: competitorAds,
            country: formData.language.toUpperCase(), // e.g. "EN" -> "EN"
            affiliate_url: formData.affiliate_url, // PASS THIS
            google_ads_id: formData.google_ads_id, // PASS THIS
            image_url: formData.image_url, // PASS THIS
            video_url: formData.video_url, // PASS THIS
            sales_page_image_url: formData.sales_page_image_url, // PASS THIS (Fixed)
            digistore_product_id: formData.digistore_product_id // PASS THIS (Manual Override)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to auto-create product');
      }

      // 2. Post-Save Update: Removed redundant patch
      // Auto-create now handles all fields including affiliate_url and image_url correctly.
      // Calling save again was overwriting the product with partial data.
      
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
                
                {/* 1. Affiliate URL (Money Link) - Source of Truth */}
                <FormField>
                    <FormLabel className="text-lg flex items-center gap-2">
                        <span>💰</span> Your Affiliate Link (JohnPace)
                        <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Commission Target & AI Source</span>
                    </FormLabel>
                    <FormInput 
                        type="url" 
                        value={formData.affiliate_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, affiliate_url: e.target.value }))}
                        placeholder="https://hop.clickbank.net/?affiliate=johnpace..."
                        className={`text-xl font-mono ${!formData.affiliate_url ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-green-300 bg-green-50 focus:border-green-500'}`}
                        error={!formData.affiliate_url}
                    />
                    {!formData.affiliate_url ? (
                        <p className="text-red-600 font-bold mt-2 animate-pulse flex items-center gap-2">
                            ⚠️ Required: Paste your commission link. Gemini will read the destination page to write the copy.
                        </p>
                    ) : (
                         <p className="text-green-600 font-bold mt-2 flex items-center gap-2">
                            ✅ AI Ready: Destination content will be analyzed automatically.
                        </p>
                    )}
                </FormField>

                {/* 1.5 Digistore24 Product ID (Optional Override) */}
                {formData.affiliate_url && formData.affiliate_url.includes('digistore24') && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl animate-fade-in mb-6">
                    <FormLabel className="text-blue-800 uppercase tracking-wide flex items-center gap-2">
                        <span>🔢</span> Digistore24 Product ID (Manual Override)
                    </FormLabel>
                    <div className="flex gap-2">
                        <FormInput 
                            type="text" 
                            value={formData.digistore_product_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, digistore_product_id: e.target.value.replace(/[^0-9]/g, '') }))}
                            placeholder="e.g. 531355"
                            className="font-mono text-lg bg-white border-blue-300 focus:ring-blue-200"
                        />
                        <div className="text-xs text-blue-600 max-w-[200px] leading-tight flex items-center">
                            If AI fails to find the ID, enter the 6-digit number here to fix the link automatically.
                        </div>
                    </div>
                </div>
                )}

                {/* 2. Pixel ID (Tracking) */}
                <FormField>
                    <FormLabel className="text-gray-600 uppercase tracking-wide">
                        Google Ads Pixel ID (Optional)
                    </FormLabel>
                    <FormInput 
                        type="text" 
                        value={formData.google_ads_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, google_ads_id: e.target.value }))}
                        placeholder="AW-XXXXXXXX"
                        className="font-mono text-sm bg-gray-50 focus:bg-white"
                    />
                </FormField>

                {/* 3. Media Assets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <FormField>
                        <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-lg text-gray-800 flex items-center gap-2 mb-0">
                                <span>🖼️</span> Image URL
                            </FormLabel>
                            <button 
                                type="button"
                                onClick={() => openAssetModal('image', 'image_url')}
                                className="text-sm font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
                                title="Open Asset Gallery"
                            >
                                <span>🖼️</span> Select from Gallery
                            </button>
                        </div>
                        <FormInput 
                            type="url" 
                            value={formData.image_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                            placeholder="https://..."
                            className="text-base text-black placeholder:text-gray-500"
                        />
                    </FormField>

                    {/* Sales Page Preview (Background) */}
                    <FormField>
                        <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-lg text-gray-800 flex items-center gap-2 mb-0">
                                <span>🖥️</span> Sales Page Preview (Background)
                            </FormLabel>
                            <button 
                                type="button"
                                onClick={() => openAssetModal('image', 'sales_page_image_url')}
                                className="text-sm font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
                                title="Open Asset Gallery"
                            >
                                <span>🖼️</span> Select
                            </button>
                        </div>
                        <FormInput 
                            type="url" 
                            value={formData.sales_page_image_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, sales_page_image_url: e.target.value }))}
                            placeholder="https://..."
                            className="text-base text-black placeholder:text-gray-500"
                        />
                    </FormField>

                    {/* Video */}
                    <div className="md:col-span-2">
                        <FormField>
                            <div className="flex justify-between items-center mb-2">
                                <FormLabel className="text-lg text-gray-800 flex items-center gap-2 mb-0">
                                    <span>🎥</span> Video URL
                                </FormLabel>
                                <button 
                                    type="button"
                                    onClick={() => openAssetModal('video', 'video_url')}
                                    className="text-sm font-bold text-gray-600 hover:text-red-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300 transition-all shadow-sm"
                                    title="Open Video Gallery"
                                >
                                    <span>🎥</span> Select from Gallery
                                </button>
                            </div>
                            <FormInput 
                                type="url" 
                                value={formData.video_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                                placeholder="https://..."
                                className="text-base text-black placeholder:text-gray-500"
                            />
                        </FormField>
                    </div>
                </div>

            </div>

            {/* Action Area */}
            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col gap-4">
                
                {/* 1. Dry Run / Route Test Button */}
                <button 
                    type="button"
                    onClick={async (e) => {
                        e.preventDefault();
                        if (!formData.affiliate_url) {
                            setMessage({ type: 'error', text: 'Affiliate URL is required for Dry Run.' });
                            return;
                        }
                        
                        setLoading(true);
                        try {
                            // Manual save without AI
                            let name = formData.name;
                            if (!name) {
                                try {
                                    const u = new URL(formData.affiliate_url);
                                    const parts = u.hostname.split('.');
                                    name = (parts.length > 2 ? parts[1] : parts[0]);
                                    name = name.charAt(0).toUpperCase() + name.slice(1);
                                } catch { name = 'Test Product'; }
                            }

                            // 1. Manual Save (Route Test)
                            const res = await fetch('/api/admin/products', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...formData,
                                    name,
                                    official_url: formData.affiliate_url, // Use affiliate as official for dry run
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
                    disabled={loading || !formData.affiliate_url}
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

      {/* Asset Selection Modal */}
      {showAssetModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[80vh] flex flex-col animate-scale-in">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-xl text-gray-800">Select {assetModalType === 'image' ? 'Image' : 'Video'} Asset</h3>
                          <p className="text-xs text-gray-500">Choose from your saved library</p>
                      </div>
                      <button 
                          onClick={() => setShowAssetModal(false)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                          ✕
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                      {libraryAssets.filter(a => a.type === assetModalType).map((asset) => (
                          <div 
                              key={asset.id}
                              onClick={() => {
                                  // Dynamic Field Update
                                  if (assetModalType === 'image') {
                                      // Check target field to decide where to put the image
                                      if (targetField === 'sales_page_image_url') {
                                          setFormData(prev => ({ ...prev, sales_page_image_url: asset.url }));
                                      } else {
                                          setFormData(prev => ({ ...prev, image_url: asset.url }));
                                      }
                                  }
                                  else {
                                      setFormData(prev => ({ ...prev, video_url: asset.url }));
                                  }
                                  setShowAssetModal(false);
                              }}
                              className="group cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-xl overflow-hidden relative transition-all"
                          >
                              <div className="aspect-video bg-gray-100 relative">
                                  {asset.type === 'image' ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={asset.url} alt={asset.label} className="w-full h-full object-contain p-2" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-red-500">
                                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                      </div>
                                  )}
                              </div>
                              <div className="p-3 bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                  <p className="font-bold text-sm truncate">{asset.label || 'Untitled'}</p>
                                  <p className="text-[10px] text-gray-500 uppercase">{asset.productName}</p>
                                  {asset.notes && <p className="text-[10px] text-blue-600 mt-1 truncate">📝 {asset.notes}</p>}
                              </div>
                          </div>
                      ))}
                      
                      {libraryAssets.filter(a => a.type === assetModalType).length === 0 && (
                          <div className="col-span-full py-10 text-center text-gray-400">
                              <p>No {assetModalType}s found in library.</p>
                              <a href="/admin/assets" target="_blank" className="text-blue-600 hover:underline text-sm">Go to Asset Manager to add one.</a>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
