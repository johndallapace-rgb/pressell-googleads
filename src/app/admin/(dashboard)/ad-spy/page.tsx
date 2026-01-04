'use client';

import { useState, useEffect } from 'react';

interface Product {
  slug: string;
  name: string;
  vertical: string;
}

interface AdVariation {
  name: string;
  headlines: string[];
  descriptions: string[];
}

interface SpyResult {
  analysis: string;
  variations: AdVariation[];
}

export default function AdSpyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [competitorCopy, setCompetitorCopy] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<SpyResult | null>(null);

  // Fetch products for dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (data.products) {
            const list = Object.entries(data.products).map(([slug, p]: any) => ({
                slug,
                name: p.name,
                vertical: p.vertical
            }));
            setProducts(list);
        }
      } catch (e) {
        console.error('Failed to load products', e);
      }
    }
    fetchProducts();
  }, []);

  const handleAnalyze = async () => {
    if (!competitorCopy.trim() && !competitorUrl.trim()) {
        alert('Please paste competitor ad copy OR a URL.');
        return;
    }

    setLoading(true);
    setResult(null);

    try {
        // Find context
        const product = products.find(p => p.slug === selectedProduct);
        const context = product ? { name: product.name, vertical: product.vertical } : null;

        const res = await fetch('/api/admin/ads/spy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                competitor_copy: competitorCopy,
                competitor_url: competitorUrl,
                product_context: context
            })
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setResult(data);

    } catch (e: any) {
        alert('Analysis failed: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveToManager = async (variation: AdVariation) => {
      if (!selectedProduct) {
          alert('Please select a Target Product first to save ads.');
          return;
      }
      setSaving(variation.name);
      try {
          const res = await fetch('/api/admin/products/save-ad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  slug: selectedProduct,
                  ad_variation: variation
              })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          alert(`✅ Saved "${variation.name}" to ${selectedProduct} campaigns!`);
      } catch (e: any) {
          alert('Failed to save: ' + e.message);
      } finally {
          setSaving(null);
      }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        🕵️ Ad Spy Analytics
      </h1>
      <p className="text-gray-600">
        Paste competitor ads or landing page URLs. Gemini will analyze their hooks and generate superior variations.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        
        {/* Product Selector */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Product (Context)</label>
            <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black bg-white shadow-sm text-base"
            >
                <option value="">-- Select Your Product (Required for Saving) --</option>
                {products.map(p => (
                    <option key={p.slug} value={p.slug}>
                        {p.name} ({p.vertical})
                    </option>
                ))}
            </select>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Competitor Copy Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Ad Copy (Text)</label>
                <textarea 
                    value={competitorCopy}
                    onChange={(e) => setCompetitorCopy(e.target.value)}
                    className="w-full h-48 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-500 bg-white shadow-sm text-base font-mono selection:bg-blue-200 selection:text-black"
                    placeholder="Paste headlines, descriptions..."
                />
            </div>
            
            {/* Competitor URL Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Landing Page URL</label>
                <input 
                    type="url"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-500 bg-white shadow-sm text-base selection:bg-blue-200 selection:text-black mb-4"
                    placeholder="https://competitor-offer.com"
                />
                <p className="text-xs text-gray-500">
                    If provided, we will fetch the page content to analyze their "blind spots" and landing page hooks.
                </p>
            </div>
        </div>

        <button 
            onClick={handleAnalyze}
            disabled={loading || (!competitorCopy && !competitorUrl)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing & Outperforming...
                </>
            ) : (
                '🚀 Analyze & Outperform'
            )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
            {/* Analysis Box */}
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2 uppercase text-sm">Competitor Weakness Analysis</h3>
                <p className="text-yellow-900 text-sm leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {result.variations.map((v, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="font-bold text-gray-800 text-sm">{v.name}</h4>
                        </div>
                        <div className="p-4 space-y-4 flex-1">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Headlines</p>
                                <ul className="space-y-1">
                                    {v.headlines.map((h, i) => (
                                        <li key={i} className="text-sm text-black bg-gray-50 p-2 rounded border border-gray-100 selection:bg-blue-200 selection:text-black">
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Descriptions</p>
                                <ul className="space-y-1">
                                    {v.descriptions.map((d, i) => (
                                        <li key={i} className="text-sm text-black bg-gray-50 p-2 rounded border border-gray-100 selection:bg-blue-200 selection:text-black">
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {(v as any).pixel_instruction && (
                                <div className="bg-green-50 p-2 rounded border border-green-100">
                                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Pixel Setup</p>
                                    <p className="text-xs text-green-800">{(v as any).pixel_instruction}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button 
                                onClick={() => handleSaveToManager(v)}
                                disabled={saving === v.name}
                                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold py-2 px-4 rounded text-sm transition-colors flex justify-center items-center gap-2"
                            >
                                {saving === v.name ? 'Saving...' : '💾 Save to Ads Manager'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
