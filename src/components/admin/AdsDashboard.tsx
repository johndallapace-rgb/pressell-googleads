"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdProductSummary {
  slug: string;
  name: string;
  vertical: string;
  languages: string[];
  adsStatus: 'draft' | 'ready' | 'published' | 'paused';
  generatedAt: string | null;
  version: number;
}

export default function AdsDashboard() {
  const [products, setProducts] = useState<AdProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search
      });
      const res = await fetch(`/api/admin/ads/list?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const toggleSelect = (slug: string) => {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedSlugs(next);
  };

  const toggleSelectAll = () => {
    if (selectedSlugs.size === products.length) {
      setSelectedSlugs(new Set());
    } else {
      setSelectedSlugs(new Set(products.map(p => p.slug)));
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedSlugs.size === 0) return;
    if (!confirm(`Generate ads for ${selectedSlugs.size} products? This may take a moment.`)) return;

    setProcessing(true);
    setProgress('Starting...');
    
    const slugs = Array.from(selectedSlugs);
    const BATCH_SIZE = 5;
    
    try {
      for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
        const batch = slugs.slice(i, i + BATCH_SIZE);
        setProgress(`Processing ${i + 1} to ${Math.min(i + BATCH_SIZE, slugs.length)} of ${slugs.length}...`);
        
        await fetch('/api/admin/ads/bulk/generate', {
            method: 'POST',
            body: JSON.stringify({ slugs: batch })
        });
      }
      setProgress('Done!');
      await fetchProducts(); // Refresh
      setSelectedSlugs(new Set());
    } catch (e) {
        alert('Error during bulk generation');
    } finally {
        setProcessing(false);
        setProgress('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header / Toolbar */}
      <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="border rounded px-3 py-2 text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
           {selectedSlugs.size > 0 && (
             <span className="text-sm text-gray-500 mr-2">{selectedSlugs.size} selected</span>
           )}
           <button 
             onClick={handleBulkGenerate}
             disabled={selectedSlugs.size === 0 || processing}
             className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {processing ? 'Processing...' : 'Generate Selected'}
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      {processing && (
          <div className="bg-blue-50 px-4 py-2 text-sm text-blue-700 border-b">
              {progress}
          </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={products.length > 0 && selectedSlugs.size === products.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-4">Product</th>
              <th className="p-4">Vertical</th>
              <th className="p-4">Status</th>
              <th className="p-4">Generated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.slug} className="hover:bg-gray-50 group">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedSlugs.has(p.slug)}
                      onChange={() => toggleSelect(p.slug)}
                    />
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    <Link href={`/admin/ads/${p.slug}`} className="hover:underline text-blue-600">
                        {p.name}
                    </Link>
                    <div className="text-xs text-gray-400">{p.slug}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {p.vertical}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.adsStatus === 'published' ? 'bg-green-100 text-green-800' :
                        p.adsStatus === 'ready' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.adsStatus}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                        href={`/admin/ads/${p.slug}`}
                        className="text-gray-400 hover:text-blue-600"
                    >
                        Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex justify-between items-center">
         <button 
           disabled={page === 1}
           onClick={() => setPage(p => p - 1)}
           className="px-3 py-1 border rounded text-sm disabled:opacity-50"
         >
           Previous
         </button>
         <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
         <button 
           disabled={page === totalPages}
           onClick={() => setPage(p => p + 1)}
           className="px-3 py-1 border rounded text-sm disabled:opacity-50"
         >
           Next
         </button>
      </div>
    </div>
  );
}
