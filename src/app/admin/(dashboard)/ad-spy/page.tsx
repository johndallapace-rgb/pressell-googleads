'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdSpyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params - Source of Truth
  const queryParam = searchParams.get('q') || '';
  const countryParam = searchParams.get('country') || 'US';
  const targetUrlParam = searchParams.get('targetUrl') || '';

  // Local State
  const [competitorCopy, setCompetitorCopy] = useState('');
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [targetCountry, setTargetCountry] = useState(countryParam);
  const [loading, setLoading] = useState(false);

  // Sync params if changed (Correction: Handle direct navigation or deep links)
  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
    if (countryParam) setTargetCountry(countryParam);
  }, [queryParam, countryParam]);

  const handleGenerateWinner = async () => {
    if (!competitorCopy.trim()) {
        alert('Please paste competitor ad copy first.');
        return;
    }

    if (!targetUrlParam) {
        alert('Missing Target URL. Please start from Market Trends.');
        return;
    }

    setLoading(true);

    try {
        // 1. Call Auto-Create API
        const res = await fetch('/api/admin/products/auto-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                importUrl: targetUrlParam,
                name: searchQuery,
                competitorAds: competitorCopy,
                country: targetCountry
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to auto-create product');

        // 2. Redirect to My Products
        router.push('/admin/products');
        router.refresh();

    } catch (e: any) {
        alert('Failed: ' + e.message);
        setLoading(false);
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
                    className="w-full border border-blue-200 rounded px-3 py-2 text-black font-medium"
                    placeholder="e.g. Advanced Amino Formula"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Target Country</label>
                <select 
                    value={targetCountry} 
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full border border-blue-200 rounded px-3 py-2 text-black font-medium"
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
        
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Ad Copy (Paste here)</label>
            <textarea 
                value={competitorCopy}
                onChange={(e) => setCompetitorCopy(e.target.value)}
                className="w-full h-48 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-500 bg-white shadow-sm text-base font-mono selection:bg-blue-200 selection:text-black"
                placeholder="Paste headlines, descriptions from the Google Search results..."
            />
        </div>

        <button 
            onClick={handleGenerateWinner}
            disabled={loading || !competitorCopy}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Winner Pre-sell...
                </>
            ) : (
                '🚀 Generate Winner Pre-sell'
            )}
        </button>
      </div>
    </div>
  );
}
