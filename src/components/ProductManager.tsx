'use client';

import { useState } from 'react';
import { CampaignConfig, ProductConfig } from '@/lib/config';

// Default template for new products
const defaultNewProduct = (slug: string): ProductConfig => ({
  slug,
  name: 'New Product',
  category: 'health',
  language: 'en',
  platform: 'clickbank',
  status: 'paused',
  official_url: '',
  affiliate_url: '',
  cta_text: 'Check Availability',
  presell_style: 'health_editorial',
  seo: { title: 'New Product', description: '' },
  heroHeadline: 'New Product Review',
  subHeadline: '',
  bullets: [],
  badges: [],
  whatIs: { title: 'What Is It?', content: [] },
  howItWorks: { title: 'How It Works', content: [] },
  prosCons: { pros: [], cons: [] },
  faqs: [],
  reviews: []
});

export default function ProductManager({ initialConfig, readOnly = false }: { initialConfig: CampaignConfig, readOnly?: boolean }) {
  const [config, setConfig] = useState<CampaignConfig>(initialConfig);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [editingSlug, setEditingSlug] = useState<string>(Object.keys(initialConfig.products)[0] || '');
  const [newSlug, setNewSlug] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const productKeys = Object.keys(config.products);
  const currentProduct = config.products[editingSlug];

  const handleSave = async () => {
    if (readOnly) return;
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

  const updateProduct = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [editingSlug]: {
          ...prev.products[editingSlug],
          [key]: value
        }
      }
    }));
  };

  const updateSeo = (key: 'title' | 'description', value: string) => {
    setConfig(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [editingSlug]: {
          ...prev.products[editingSlug],
          seo: {
            ...prev.products[editingSlug].seo,
            [key]: value
          }
        }
      }
    }));
  };

  const handleAddProduct = () => {
    if (!newSlug || config.products[newSlug]) return;
    
    setConfig(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [newSlug]: defaultNewProduct(newSlug)
      }
    }));
    setEditingSlug(newSlug);
    setNewSlug('');
    setIsAdding(false);
  };

  if (!currentProduct && productKeys.length > 0) {
    setEditingSlug(productKeys[0]);
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold">Product Management</h2>
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
            {status === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Product List / Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b">
        {productKeys.map(slug => (
          <button
            key={slug}
            onClick={() => setEditingSlug(slug)}
            className={`
              whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${editingSlug === slug 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            {config.products[slug].name}
            {config.products[slug].status === 'paused' && <span className="ml-2 text-xs text-red-500">(Paused)</span>}
          </button>
        ))}
        
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300"
          >
            + Add Product
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              value={newSlug}
              onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="slug-name"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
              autoFocus
            />
            <button onClick={handleAddProduct} className="text-green-600 font-bold">✓</button>
            <button onClick={() => setIsAdding(false)} className="text-gray-400">✕</button>
          </div>
        )}
      </div>

      {currentProduct && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{currentProduct.name}</h3>
              <p className="text-sm text-gray-500">Slug: <code className="bg-gray-100 px-1 rounded">{currentProduct.slug}</code></p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select 
                value={currentProduct.status}
                onChange={e => updateProduct('status', e.target.value)}
                className={`border rounded px-2 py-1 text-sm font-bold ${currentProduct.status === 'active' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input 
                type="text" 
                value={currentProduct.name}
                onChange={e => updateProduct('name', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select 
                value={currentProduct.language}
                onChange={e => updateProduct('language', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
             <h4 className="font-medium text-gray-900 border-b pb-2">Links & Destinations</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Affiliate URL (Final Destination)</label>
                   <input 
                     type="url" 
                     value={currentProduct.affiliate_url}
                     onChange={e => updateProduct('affiliate_url', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Official URL (Fallback)</label>
                   <input 
                     type="url" 
                     value={currentProduct.official_url}
                     onChange={e => updateProduct('official_url', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">YouTube Review URL</label>
                   <input 
                     type="text" 
                     value={currentProduct.review_url || ''}
                     onChange={e => updateProduct('review_url', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   />
                </div>
             </div>
          </div>

          {/* Style & SEO */}
          <div className="space-y-4">
             <h4 className="font-medium text-gray-900 border-b pb-2">Style & SEO</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Presell Style</label>
                   <select 
                     value={currentProduct.presell_style}
                     onChange={e => updateProduct('presell_style', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   >
                     <option value="health_editorial">Health Editorial</option>
                     <option value="diy_review">DIY/Review</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">CTA Text</label>
                   <input 
                     type="text" 
                     value={currentProduct.cta_text}
                     onChange={e => updateProduct('cta_text', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">SEO Title</label>
                   <input 
                     type="text" 
                     value={currentProduct.seo?.title || ''}
                     onChange={e => updateSeo('title', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">SEO Description</label>
                   <textarea 
                     value={currentProduct.seo?.description || ''}
                     onChange={e => updateSeo('description', e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                     rows={2}
                   />
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
