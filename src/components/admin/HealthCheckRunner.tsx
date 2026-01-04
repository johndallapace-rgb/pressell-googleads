'use client';

import { useState } from 'react';

interface ProductLink {
  slug: string;
  affiliate_url?: string;
  name?: string;
}

interface CheckResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

export default function HealthCheckRunner({ products }: { products: ProductLink[] }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runCheck = async () => {
    setChecking(true);
    setResults({});
    
    // Filter valid URLs
    const urlsToCheck = products
        .filter(p => p.affiliate_url && p.affiliate_url.startsWith('http'))
        .map(p => p.affiliate_url as string);

    if (urlsToCheck.length === 0) {
        alert('No valid affiliate URLs found to check.');
        setChecking(false);
        return;
    }

    try {
        const res = await fetch('/api/admin/diagnostics/check-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: urlsToCheck })
        });
        const data = await res.json();
        
        if (data.results) {
            // Map results by URL for easy lookup
            const resultMap: Record<string, CheckResult> = {};
            data.results.forEach((r: CheckResult) => {
                resultMap[r.url] = r;
            });
            setResults(resultMap);
            setLastRun(new Date().toLocaleTimeString());
        }
    } catch (e) {
        console.error(e);
        alert('Health Check failed to run.');
    } finally {
        setChecking(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-8">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                🩺 Smart Health Check
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                Verifies if your affiliate links are alive (200 OK) or broken (404/500).
            </p>
          </div>
          <div className="text-right">
              {lastRun && <p className="text-xs text-gray-400 mb-2">Last run: {lastRun}</p>}
              <button 
                onClick={runCheck}
                disabled={checking}
                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {checking ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking Links...
                    </>
                ) : (
                    'Run Health Check'
                )}
              </button>
          </div>
      </div>

      <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Affiliate Link</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((p) => {
                  const url = p.affiliate_url;
                  const result = url ? results[url] : null;
                  
                  return (
                    <tr key={p.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name || p.slug}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-xs" title={url}>
                          {url || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                          {!url ? (
                              <span className="text-gray-400">-</span>
                          ) : !result ? (
                              <span className="text-gray-400 text-xs">Pending</span>
                          ) : result.ok ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  🟢 {result.status} OK
                              </span>
                          ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                  🔴 {result.status || 'ERR'} {result.error ? `(${result.error})` : 'Failed'}
                              </span>
                          )}
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
      </div>
    </section>
  );
}
