'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const countryParam = searchParams.get('country') || 'US';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [competitorCopy, setCompetitorCopy] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [targetCountry, setTargetCountry] = useState(countryParam);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<SpyResult | null>(null);

  // Sync params if changed
  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
    if (countryParam) setTargetCountry(countryParam);
  }, [queryParam, countryParam]);

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

      {/* SEARCH LABS INTEGRATION */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
         <h2 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
            🌍 Real-Time SearchFrom (Native)
         </h2>
         <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Product / Niche Keyword</label>
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-blue-200 rounded px-3 py-2"
                    placeholder="e.g. Advanced Amino Formula"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Target Country</label>
                <select 
                    value={targetCountry} 
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full border border-blue-200 rounded px-3 py-2"
                >
                    <option value="US">🇺🇸 United States</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="BR">🇧🇷 Brazil</option>
                </select>
            </div>
            <div>
                <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&gl=${targetCountry}&hl=${targetCountry === 'DE' ? 'de' : targetCountry === 'FR' ? 'fr' : targetCountry === 'BR' ? 'pt' : 'en'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    Open Google ({targetCountry})
                </a>
            </div>
         </div>
         <p className="text-xs text-blue-500 mt-2">
            Click to open a native Google Search as if you were in that country. Copy the best ads you see below!
         </p>
      </div>

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
                <div className="flex gap-2">
                    <input 
                        type="url"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-500 bg-white shadow-sm text-base selection:bg-blue-200 selection:text-black mb-4"
                        placeholder="https://competitor-offer.com"
                    />
                    <button
                        onClick={async () => {
                            if (!competitorUrl) return alert('Please enter a URL first');
                            setLoading(true);
                            try {
                                const res = await fetch('/api/admin/scrape', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ url: competitorUrl })
                                });
                                const data = await res.json();
                                if (data.error) throw new Error(data.error);
                                setCompetitorCopy(prev => (prev ? prev + "\n\n" : "") + "=== SCRAPED CONTENT ===\n" + data.content);
                                alert('✅ Content scraped and added to analysis field!');
                            } catch (e: any) {
                                alert('Scraping failed: ' + e.message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading || !competitorUrl}
                        className="bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 mb-4 whitespace-nowrap"
                    >
                        🕷️ Scrape & Feed AI
                    </button>
                </div>
                <p className="text-xs text-gray-500">
                    If provided, use the button to fetch and clean the page content automatically.
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
