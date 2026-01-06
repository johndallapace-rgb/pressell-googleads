'use client';

import { useState, useEffect } from 'react';
import { ProductConfig, FaqItem } from '@/lib/config';
import { templates, getTemplate, VerticalType, TemplateType } from '@/lib/templates';

import { AdsConfig } from '@/lib/ads/types';

interface ProductFormProps {
  initialProduct?: ProductConfig;
  onSubmit: (product: ProductConfig) => Promise<void>;
  isNew?: boolean;
  readOnly?: boolean;
}

const defaultProduct: ProductConfig = {
  slug: '',
  name: '',
  platform: 'clickbank',
  language: 'en',
  status: 'active', // Default to active for less friction
  vertical: 'health',
  template: 'editorial',
  official_url: '',
  affiliate_url: '',
  image_url: '',
  headline: '',
  subheadline: '',
  cta_text: 'Check Availability',
  bullets: [''],
  faq: [{ q: '', a: '' }],
  seo: { title: '', description: '' },
  whatIs: { title: 'What Is It?', content: [''] },
  howItWorks: { title: 'How It Works?', content: [''] },
  prosCons: { pros: [''], cons: [''] }
};

export default function ProductForm({ initialProduct, onSubmit, isNew = false, readOnly = false }: ProductFormProps) {
  const [product, setProduct] = useState<ProductConfig>(initialProduct || defaultProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [abTestEnabled, setAbTestEnabled] = useState(false);

  // AI Generation State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPromptData, setAiPromptData] = useState({ productName: '', niche: 'health', competitorText: '', tone: 'persuasive', layout: 'editorial' });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // New State for Negatives
  const [negatives, setNegatives] = useState<string[]>([]);
  const [reGenerating, setReGenerating] = useState(false);

  useEffect(() => {
    if (initialProduct?.ab_test?.enabled) {
        setAbTestEnabled(true);
    }
    // Initialize Negatives from first campaign/adGroup if available
    if (initialProduct?.ads?.campaigns?.[0]?.adGroups?.[0]?.negativeKeywords) {
        setNegatives(initialProduct.ads.campaigns[0].adGroups[0].negativeKeywords);
    }
  }, [initialProduct]);

  // Sync negatives back to product state before submit
  useEffect(() => {
      if (negatives.length > 0) {
          setProduct(prev => {
              // Deep clone or safe update
              const newAds = prev.ads ? { ...prev.ads } : {
                  status: 'ready',
                  campaigns: [{
                      campaignName: `${prev.name} - Search`,
                      adGroups: [{ name: 'General', keywords: [], ads: [], negativeKeywords: [] }]
                  }]
              };
              
              // Ensure structure exists
              if (!newAds.campaigns) newAds.campaigns = [];
              if (!newAds.campaigns[0]) newAds.campaigns[0] = { campaignName: '', adGroups: [] };
              if (!newAds.campaigns[0].adGroups) newAds.campaigns[0].adGroups = [];
              if (!newAds.campaigns[0].adGroups[0]) newAds.campaigns[0].adGroups[0] = { name: '', keywords: [], ads: [] };

              newAds.campaigns[0].adGroups[0].negativeKeywords = negatives;
              
              return { ...prev, ads: newAds as any };
          });
      }
  }, [negatives]);

  const handleReGenerateMagic = async () => {
      if (!product.official_url) return alert('Official URL is required.');
      if (!confirm('⚠️ This will overwrite your Headlines, Bullets, Images, and Ads with a fresh AI analysis. Continue?')) return;

      setReGenerating(true);
      try {
        const res = await fetch('/api/admin/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                official_url: product.official_url,
                strategy: 'standard' // Default for regen
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Apply Magic
        setProduct(prev => ({
            ...prev,
            headline: data.headline_suggestions?.[0] || prev.headline,
            subheadline: data.subheadline_suggestions?.[0] || prev.subheadline,
            bullets: data.bullets_suggestions || prev.bullets,
            pain_points: data.pain_points || prev.pain_points,
            unique_mechanism: data.unique_mechanism || prev.unique_mechanism,
            image_url: data.image_url || prev.image_url,
            seo: {
                title: data.seo?.title || prev.seo.title,
                description: data.seo?.description || prev.seo.description
            },
            // Also update Ads if present
            ads: data.google_ads ? {
                ...prev.ads,
                campaigns: [{
                    campaignName: `${prev.name} - Search`,
                    adGroups: [{
                        name: 'General Interest',
                        keywords: [`${prev.name} reviews`, `buy ${prev.name}`],
                        negativeKeywords: negatives, // Keep existing negatives
                        ads: [{
                            headlines: data.google_ads.headlines,
                            descriptions: data.google_ads.descriptions,
                            finalUrl: prev.official_url
                        }]
                    }]
                }]
            } : prev.ads
        }));

        alert('✨ Magic Re-generated! Content updated based on latest analysis.');

      } catch (e: any) {
        alert('Magic failed: ' + e.message);
      } finally {
        setReGenerating(false);
      }
  };

  const toggleAbTest = () => {
      const newState = !abTestEnabled;
      setAbTestEnabled(newState);
      setProduct(prev => ({
          ...prev,
          ab_test: {
              enabled: newState,
              variants: prev.ab_test?.variants || [
                  { id: 'A', weight: 50, headline: prev.headline, cta_text: prev.cta_text },
                  { id: 'B', weight: 50, headline: prev.headline + ' (Variant B)', cta_text: prev.cta_text }
              ]
          }
      }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
      const newVariants = [...(product.ab_test?.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      setProduct(prev => ({
          ...prev,
          ab_test: { ...prev.ab_test!, variants: newVariants }
      }));
  };

  const handleChange = (field: keyof ProductConfig, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleSeoChange = (field: 'title' | 'description', value: string) => {
    setProduct(prev => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
  };

  const handleArrayChange = (field: 'bullets', index: number, value: string) => {
    const newArray = [...product[field]];
    newArray[index] = value;
    setProduct(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'bullets') => {
    setProduct(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field: 'bullets', index: number) => {
    const newArray = [...product[field]];
    newArray.splice(index, 1);
    setProduct(prev => ({ ...prev, [field]: newArray }));
  };

  const handleFaqChange = (index: number, field: keyof FaqItem, value: string) => {
    const newFaq = [...product.faq];
    newFaq[index] = { ...newFaq[index], [field]: value };
    setProduct(prev => ({ ...prev, faq: newFaq }));
  };

  const addFaq = () => {
    setProduct(prev => ({ ...prev, faq: [...prev.faq, { q: '', a: '' }] }));
  };

  const removeFaq = (index: number) => {
    const newFaq = [...product.faq];
    newFaq.splice(index, 1);
    setProduct(prev => ({ ...prev, faq: newFaq }));
  };

  const handleGenerateDraft = () => {
    if (!confirm('This will overwrite current content (Headline, Bullets, FAQ, etc). Continue?')) return;
    
    const templateDef = getTemplate(product.vertical as VerticalType, product.template as TemplateType);
    if (templateDef && templateDef.defaultContent) {
      setProduct(prev => ({
        ...prev,
        ...templateDef.defaultContent,
        seo: {
             title: templateDef.defaultContent.headline || prev.seo.title,
             description: templateDef.defaultContent.subheadline || prev.seo.description
        }
      }));
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPromptData.productName || !aiPromptData.niche) {
        alert('Product Name and Niche are required');
        return;
    }
    setAiLoading(true);
    try {
        const res = await fetch('/api/admin/generate-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiPromptData)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'AI generation failed');

        // Apply generated content
        setProduct(prev => ({
            ...prev,
            name: aiPromptData.productName, // Ensure name matches
            vertical: (data.vertical || prev.vertical) as any, // Force vertical from AI
            status: 'active', // FORCE ACTIVE STATUS
            headline: data.headline || prev.headline,
            subheadline: data.subheadline || prev.subheadline,
            bullets: data.bulletPoints || prev.bullets,
            // Map 'content' to 'whatIs.content' (splitting by paragraph or just wrapping in array)
            whatIs: { 
                title: 'What Is It?', 
                content: data.content ? [data.content] : prev.whatIs?.content || [''] 
            },
            // We can also populate SEO if empty
            seo: {
                title: data.headline || prev.seo.title,
                description: data.subheadline || prev.seo.description
            },
            // Save AI Suggested Image Prompt
            image_prompt: data.imagePrompt || prev.image_prompt,
            
            // Save Quiz if present
            quiz: data.quizQuestions ? {
                enabled: true,
                questions: data.quizQuestions
            } : prev.quiz,
            
            // Save generated ads to the ads module config if present
            ads: data.ads ? {
                slug: prev.slug || aiPromptData.productName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                vertical: prev.vertical as any,
                languages: [prev.language],
                status: 'ready',
                generatedAt: new Date().toISOString(),
                version: (prev.ads?.version || 0) + 1,
                settings: prev.ads?.settings || {
                    bidStrategy: 'Manual CPC',
                    dailyBudget: 50,
                    locations: ['United States'],
                    languages: ['en'],
                    networks: 'Search'
                },
                campaigns: [{
                    product: prev.slug || aiPromptData.productName,
                    language: prev.language,
                    campaignName: `[AI Generated] ${aiPromptData.productName}`,
                    adGroups: [{
                        name: 'AI Generated Group',
                        keywords: [aiPromptData.productName, `${aiPromptData.productName} review`, `buy ${aiPromptData.productName}`],
                        negatives: ["free", "scam"],
                        ads: [{
                            headlines: data.ads.headlines.slice(0, 15),
                            descriptions: data.ads.descriptions.slice(0, 4),
                            finalUrl: prev.official_url || 'https://example.com',
                            label: 'AI Variant'
                        }]
                    }]
                }]
            } : prev.ads,
            
            // Update Template if changed
            template: aiPromptData.layout === 'quiz' ? 'quiz' : prev.template
        }));

        setAiModalOpen(false);
        setAiAnalysis(data.ctaAnalysis || null);
        alert('✨ Content generated successfully!');
        
    } catch (e: any) {
        alert('Error: ' + e.message);
    } finally {
        setAiLoading(false);
    }
  };

  const handleQuickStructureGen = async () => {
    if (!product.name) {
        alert('Please enter a Product Name first');
        return;
    }
    setAiLoading(true);
    try {
        const res = await fetch('/api/admin/generate-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productName: product.name,
                mode: 'structure' 
            })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Structure generation failed');

        setProduct(prev => ({
            ...prev,
            vertical: data.vertical || prev.vertical,
            slug: data.slug || prev.slug,
            status: 'active', // FORCE ACTIVE STATUS
            headline: data.headline || prev.headline,
            subheadline: data.subheadline || prev.subheadline,
            bullets: data.bullets || prev.bullets,
            whatIs: { 
                title: 'What Is It?', 
                content: data.content ? [data.content] : prev.whatIs?.content || [''] 
            },
            seo: {
                title: data.headline || prev.seo.title,
                description: data.subheadline || prev.seo.description
            }
        }));

        alert('✨ Structure generated! Vertical, Slug, and Base Copy updated.');
    } catch (e: any) {
        alert('Error: ' + e.message);
    } finally {
        setAiLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ official_url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import');
      setImportResult(data);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const applyDraft = () => {
    if (!importResult) return;
    setProduct(prev => ({
      ...prev,
      name: importResult.name || prev.name,
      headline: importResult.headline_suggestions?.[0] || prev.headline,
      bullets: importResult.bullets_suggestions || prev.bullets,
      image_url: importResult.image_url || prev.image_url,
      seo: {
        title: importResult.seo?.title || prev.seo.title,
        description: importResult.seo?.description || prev.seo.description
      }
    }));
    setImportModalOpen(false);
    setImportResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setIsSaving(true);
    setError('');

    try {
      // Trim all string fields
      const cleanProduct = { ...product };
      (Object.keys(cleanProduct) as Array<keyof ProductConfig>).forEach(key => {
        if (typeof cleanProduct[key] === 'string') {
          (cleanProduct as any)[key] = (cleanProduct[key] as string).trim();
        }
      });
      cleanProduct.seo.title = cleanProduct.seo.title.trim();
      cleanProduct.seo.description = cleanProduct.seo.description.trim();

      // Validations
      if (!cleanProduct.slug) throw new Error('Slug is required');
      if (!/^[a-z0-9-]+$/.test(cleanProduct.slug)) throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
      
      if (!cleanProduct.name) throw new Error('Name is required');
      
      if (!cleanProduct.affiliate_url) throw new Error('Affiliate URL is required');
      if (!cleanProduct.affiliate_url.startsWith('https://')) throw new Error('Affiliate URL must start with https://');
      
      if (!cleanProduct.official_url) throw new Error('Official URL is required');
      if (!cleanProduct.official_url.startsWith('https://')) throw new Error('Official URL must start with https://');
      
      if (!cleanProduct.headline) throw new Error('Headline is required');
      
      if (!cleanProduct.seo.title) throw new Error('SEO Title is required');
      if (!cleanProduct.seo.description) throw new Error('SEO Description is required');

      await onSubmit(cleanProduct);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow">
      {readOnly && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-4">
          <strong>Read Only Mode:</strong> You cannot make changes because VERCEL_API_TOKEN or EDGE_CONFIG_ID is missing.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header with Status Toggle */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">
           {isNew ? 'New Product' : `Editing: ${product.name}`}
        </h2>
        <div className="flex items-center space-x-3">
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {product.status}
             </span>
             {!isNew && !readOnly && (
               <button 
                 type="button"
                 onClick={() => handleChange('status', product.status === 'active' ? 'paused' : 'active')}
                 className={`text-xs font-bold px-3 py-1 rounded border ${product.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
               >
                 {product.status === 'active' ? 'Pause Product' : 'Activate Product'}
               </button>
             )}
        </div>
      </div>
      
      {aiAnalysis && (
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 relative">
            <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-purple-400 hover:text-purple-700">×</button>
            <h4 className="font-bold text-purple-900 flex items-center gap-2">
                <span>🧠</span> AI Strategy Insight
            </h4>
            <p className="text-sm text-purple-800 mt-1">{aiAnalysis}</p>
        </div>
      )}

      {product.status === 'paused' && (
         <div className="bg-gray-50 border-l-4 border-gray-400 p-4 text-sm text-gray-600">
            ⚠️ <strong>Product is Paused:</strong> It will return a 404 error on the site and redirects will be disabled.
         </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Slug <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={product.slug}
            onChange={e => handleChange('slug', e.target.value)}
            disabled={!isNew || readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 disabled:opacity-60"
            placeholder="e.g. mitolyn"
          />
          <p className="text-xs text-gray-500 mt-1">URL-friendly ID (a-z, 0-9, hyphens)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={product.name}
            onChange={e => handleChange('name', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <select
            value={product.platform}
            onChange={e => handleChange('platform', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="clickbank">ClickBank</option>
            <option value="digistore24">Digistore24</option>
            <option value="buygoods">BuyGoods</option>
            <option value="maxweb">MaxWeb</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
          <select
            value={product.language}
            onChange={e => handleChange('language', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vertical</label>
          <select
            value={product.vertical}
            onChange={e => handleChange('vertical', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
          <label className="block text-sm font-medium text-gray-700">Template</label>
          <select
            value={product.template}
            onChange={e => handleChange('template', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="editorial">Editorial (Review)</option>
            <option value="story">Story (Personal Journey)</option>
            <option value="comparison">Comparison (Versus)</option>
          </select>
        </div>
      </div>

      {/* Draft Generator & Import */}
      {!readOnly && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex justify-between items-center">
            <div>
                <h4 className="font-bold text-blue-900">Content Tools</h4>
                <p className="text-sm text-blue-700">Generate a starting draft or import from the official page.</p>
            </div>
            <div className="flex space-x-2">
                <button 
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 flex items-center shadow-sm"
                >
                    ✨ Generate with AI
                </button>
                <button 
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded text-sm hover:bg-blue-50"
                >
                    Import from URL
                </button>
                <button 
                    type="button"
                    onClick={handleReGenerateMagic}
                    disabled={reGenerating || !product.official_url}
                    className="bg-black text-white px-6 py-2 rounded text-sm font-black hover:bg-gray-800 disabled:opacity-50 shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all border-2 border-transparent hover:border-purple-500"
                >
                    {reGenerating ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            RE-GENERATING MAGIC...
                        </>
                    ) : (
                        <>
                            <span className="text-lg">✨</span> RE-GENERATE AI CONTENT
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span>✨</span> Generate Copy with AI
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Uses Google Gemini to create high-converting presell content.
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input 
                            type="text" 
                            value={aiPromptData.productName}
                            onChange={e => setAiPromptData({...aiPromptData, productName: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g. Sugar Defender"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Niche *</label>
                        <select 
                            value={aiPromptData.niche}
                            onChange={e => setAiPromptData({...aiPromptData, niche: e.target.value})}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option value="health">Health / Supplements</option>
                            <option value="diy">DIY / Home Improvement</option>
                            <option value="finance">Finance / Crypto</option>
                            <option value="dating">Dating / Relationships</option>
                            <option value="software">Software / SaaS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Competitor URL or Text (Optional)</label>
                        <textarea 
                            value={aiPromptData.competitorText}
                            onChange={e => setAiPromptData({...aiPromptData, competitorText: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Paste VSL transcript, competitor copy, or 'Big Promise' to analyze..."
                            rows={3}
                        />
                        <p className="text-xs text-purple-600 mt-1">🕵️ Competitor Espionage: AI will analyze this to counter their angle.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tone of Voice</label>
                        <select 
                            value={aiPromptData.tone}
                            onChange={e => setAiPromptData({...aiPromptData, tone: e.target.value})}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option value="persuasive">Persuasive (Default)</option>
                            <option value="aggressive">Aggressive (Hard Sell)</option>
                            <option value="informative">Informative / Educational</option>
                            <option value="friendly">Friendly / Relatable</option>
                            <option value="urgent">Urgent / Scarcity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Layout Strategy</label>
                        <select 
                            value={aiPromptData.layout}
                            onChange={e => setAiPromptData({...aiPromptData, layout: e.target.value})}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option value="editorial">Editorial / Text (Standard)</option>
                            <option value="story">Advertorial (Storytelling)</option>
                            <option value="quiz">Interactive Quiz (High Engagement)</option>
                        </select>
                    </div>
                </div>
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
                    <button 
                        onClick={() => setAiModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        disabled={aiLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={aiLoading || !aiPromptData.productName}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {aiLoading ? 'Generating...' : '✨ Generate Content'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Import from Official Page</h3>
                </div>
                <div className="p-6 space-y-4">
                    {!importResult ? (
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                value={importUrl}
                                onChange={e => setImportUrl(e.target.value)}
                                placeholder="https://official-product-page.com"
                                className="flex-1 border p-2 rounded"
                            />
                            <button 
                                onClick={handleImport}
                                disabled={isImporting}
                                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {isImporting ? 'Scanning...' : 'Scan URL'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded border border-green-200">
                                <h4 className="font-bold text-green-800 mb-2">Found Content:</h4>
                                <ul className="text-sm space-y-1 text-green-700">
                                    <li><strong>Name:</strong> {importResult.name || 'Not found'}</li>
                                    <li><strong>SEO Title:</strong> {importResult.seo.title || 'Not found'}</li>
                                    <li><strong>Headings:</strong> {importResult.headline_suggestions.length} found</li>
                                    <li><strong>Bullets:</strong> {importResult.bullets_suggestions.length} found</li>
                                    <li><strong>Image:</strong> {importResult.image_url ? 'Found' : 'Not found'}</li>
                                </ul>
                            </div>
                            
                            {importResult.headline_suggestions.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Headline Suggestions:</label>
                                    <select className="w-full border p-2 rounded text-sm">
                                        {importResult.headline_suggestions.map((h: string, i: number) => <option key={i}>{h}</option>)}
                                    </select>
                                </div>
                            )}

                             {importResult.bullets_suggestions.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Bullets Preview:</label>
                                    <ul className="list-disc pl-5 text-sm text-gray-600">
                                        {importResult.bullets_suggestions.map((b: string, i: number) => <li key={i}>{b}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
                    <button 
                        onClick={() => { setImportModalOpen(false); setImportResult(null); }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    {importResult && (
                        <button 
                            onClick={applyDraft}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Apply Draft
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* URLs */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">Links & Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Affiliate URL (Redirect Target) <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={product.affiliate_url}
              onChange={e => handleChange('affiliate_url', e.target.value)}
              disabled={readOnly}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="https://hop.clickbank.net/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Official URL (Fallback) <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={product.official_url}
              onChange={e => handleChange('official_url', e.target.value)}
              disabled={readOnly}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="https://product.com..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube Review ID</label>
            <input
              type="text"
              value={product.youtube_review_id || ''}
              onChange={e => handleChange('youtube_review_id', e.target.value)}
              disabled={readOnly}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g. dQw4w9WgXcQ (or full URL)"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Image URL <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
                <input
                  type="text"
                  value={product.image_url}
                  onChange={e => handleChange('image_url', e.target.value)}
                  disabled={readOnly}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://... (or use File Upload below)"
                />
            </div>
            {/* Simple File to Data URL Converter */}
            <div className="mt-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Or Upload File (Auto-Converts to URL)</label>
                 <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            if (file.size > 800000) { // 800KB limit for KV safety
                                alert('File too large for KV storage. Please use a URL or keep it under 800KB.');
                                return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                handleChange('image_url', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1"
                 />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">AI Image Prompt (Suggestion)</label>
            <div className="flex gap-2">
                <textarea
                  value={product.image_prompt || ''}
                  onChange={e => handleChange('image_prompt', e.target.value)}
                  disabled={readOnly}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-600 bg-gray-50"
                  placeholder="AI will suggest an image prompt here..."
                  rows={2}
                />
                <button 
                    type="button"
                    onClick={() => setAiModalOpen(true)} // Re-open modal to generate image prompt? Or just use main generation
                    className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200"
                    title="Generate content to get a prompt"
                >
                    🎨 Suggest
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">Tracking</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Google Ads Conversion ID (Pixel)</label>
          <input
            type="text"
            value={product.google_ads_id || ''}
            onChange={e => handleChange('google_ads_id', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="AW-XXXXXXXX"
          />
          <p className="text-xs text-gray-500 mt-1">
            If provided, <code>gtag.js</code> will be injected automatically. 
            Clicks on checkout buttons will trigger a <code>conversion</code> event.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Google Ads Conversion Label (Optional)</label>
          <input
            type="text"
            value={product.google_ads_label || ''}
            onChange={e => handleChange('google_ads_label', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="e.g. DPCoCMK5h9wbENmG8L9C"
          />
        </div>
        
        {/* Negative Keywords Editor */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Negative Keywords (One per line)</label>
            <textarea
                value={negatives.join('\n')}
                onChange={(e) => setNegatives(e.target.value.split('\n'))}
                disabled={readOnly}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
                rows={5}
                placeholder="free&#10;scam&#10;login"
            />
            <p className="text-xs text-gray-500 mt-1">
                These keywords prevent ads from showing on irrelevant searches.
            </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Support Email</label>
          <input
            type="email"
            value={product.support_email || 'support@topproductofficial.com'}
            onChange={e => handleChange('support_email', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="support@topproductofficial.com"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">Content</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Headline <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={product.headline}
            onChange={e => handleChange('headline', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Subheadline</label>
          <input
            type="text"
            value={product.subheadline}
            onChange={e => handleChange('subheadline', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CTA Text</label>
          <input
            type="text"
            value={product.cta_text}
            onChange={e => handleChange('cta_text', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        {/* Bullets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bullets</label>
          {product.bullets.map((bullet, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={bullet}
                onChange={e => handleArrayChange('bullets', i, e.target.value)}
                disabled={readOnly}
                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
              />
              {!readOnly && <button type="button" onClick={() => removeArrayItem('bullets', i)} className="text-red-500 px-2">×</button>}
            </div>
          ))}
          {!readOnly && <button type="button" onClick={() => addArrayItem('bullets')} className="text-blue-600 text-sm font-medium">+ Add Bullet</button>}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">FAQ</h3>
        {product.faq.map((item, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded border">
            <div className="flex justify-between mb-2">
               <span className="text-sm font-bold text-gray-500">Q#{i+1}</span>
               {!readOnly && <button type="button" onClick={() => removeFaq(i)} className="text-red-500 text-sm">Remove</button>}
            </div>
            <input
              type="text"
              value={item.q}
              onChange={e => handleFaqChange(i, 'q', e.target.value)}
              disabled={readOnly}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
              placeholder="Question"
            />
            <textarea
              value={item.a}
              onChange={e => handleFaqChange(i, 'a', e.target.value)}
              disabled={readOnly}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Answer"
              rows={2}
            />
          </div>
        ))}
        {!readOnly && <button type="button" onClick={addFaq} className="text-blue-600 text-sm font-medium">+ Add FAQ Item</button>}
      </div>

      {/* SEO */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">SEO</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Meta Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={product.seo.title}
            onChange={e => handleSeoChange('title', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Meta Description <span className="text-red-500">*</span></label>
          <textarea
            value={product.seo.description}
            onChange={e => handleSeoChange('description', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            rows={3}
          />
        </div>
      </div>

      {/* A/B Testing */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">A/B Testing</h3>
            {!readOnly && (
                <button 
                    type="button"
                    onClick={toggleAbTest}
                    className={`px-3 py-1 rounded text-sm font-bold ${abTestEnabled ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                >
                    {abTestEnabled ? 'Enabled' : 'Disabled'}
                </button>
            )}
        </div>
        
        {abTestEnabled && product.ab_test && (
            <div className="bg-purple-50 p-4 rounded border border-purple-100 space-y-4">
                <p className="text-sm text-purple-800 mb-2">Define variants to split traffic. Weights should sum to 100.</p>
                {product.ab_test.variants.map((variant, i) => (
                    <div key={i} className="bg-white p-3 rounded shadow-sm border border-purple-100">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-700">Variant {variant.id}</span>
                            <div className="flex items-center">
                                <label className="text-xs mr-2">Weight %</label>
                                <input 
                                    type="number" 
                                    value={variant.weight} 
                                    onChange={e => updateVariant(i, 'weight', parseInt(e.target.value))}
                                    className="w-16 border rounded p-1 text-right"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={variant.headline || ''} 
                                onChange={e => updateVariant(i, 'headline', e.target.value)}
                                placeholder="Headline Override"
                                className="w-full border rounded p-2 text-sm"
                            />
                            <input 
                                type="text" 
                                value={variant.cta_text || ''} 
                                onChange={e => updateVariant(i, 'cta_text', e.target.value)}
                                placeholder="CTA Text Override"
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-6 border-t flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || readOnly}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
