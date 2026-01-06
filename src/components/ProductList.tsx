'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProductConfig } from '@/lib/config';

interface ProductListProps {
  products: ProductConfig[];
}

export default function ProductList({ products }: ProductListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const getFlag = (lang: string) => {
      const map: Record<string, string> = {
          'en': '🇺🇸', 'de': '🇩🇪', 'fr': '🇫🇷', 'pt': '🇧🇷', 'es': '🇪🇸', 'it': '🇮🇹', 'gb': '🇬🇧'
      };
      return map[lang] || '🌐';
  };

  const handleDelete = async (slug: string, name: string) => {
      if (!confirm(`Are you sure you want to PERMANENTLY delete "${name}"?\nThis will remove the page, config, images, and ads.`)) return;
      
      setDeleting(slug);
      try {
          // Use token from localStorage (set during login) or empty if not present
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : '';
          
          const res = await fetch(`/api/admin/products?slug=${slug}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          const data = await res.json();
          if (res.ok) {
              router.refresh();
          } else {
              throw new Error(data.error);
          }
      } catch (e: any) {
          alert('Delete failed: ' + e.message);
      } finally {
          setDeleting(null);
      }
  };

  const getRealLink = (p: ProductConfig) => {
      // Assuming localhost for dev, but ideally this comes from env
      const host = window.location.host; 
      const protocol = window.location.protocol;
      return `${protocol}//${host}/${p.slug}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      <div className="bg-black p-5 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-wide">MY PRODUCTS</h2>
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 font-bold">
                {products.length} Active
            </span>
        </div>
        <Link 
            href="/admin/products/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-2 transition-colors"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            NEW PRE-SELL
        </Link>
      </div>
      
      {products.length === 0 ? (
        <div className="p-12 text-center bg-gray-50">
          <p className="text-black text-lg font-bold">No products found.</p>
          <p className="text-gray-800 mt-2">Use "Market Trends" to spy and create one!</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b border-gray-300">Product & Market</th>
              <th className="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b border-gray-300">Live Status</th>
              <th className="px-6 py-4 text-right text-sm font-black text-black uppercase tracking-widest border-b border-gray-300">Management</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.filter(p => p.slug && p.slug !== 'undefined').map((product) => (
              <tr key={product.slug || product.id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm text-2xl" style={{ fontSize: '1.5rem' }}>
                        {getFlag(product.language)}
                    </div>
                    <div>
                        <div className="text-lg font-black text-black tracking-tight">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-200 text-black border border-gray-300">
                                {product.vertical}
                            </span>
                            <span className="text-sm text-black font-mono font-bold">
                                {product.slug}
                            </span>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                      <a 
                        href={`/${product.slug}`} 
                        target="_blank" 
                        className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-100 border border-blue-200 hover:bg-blue-200 hover:border-blue-300 transition-all w-fit"
                      >
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${product.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${product.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}></span>
                        </span>
                        
                        <span className="text-sm font-bold text-blue-900 font-mono group-hover:text-blue-950 underline">
                            {typeof window !== 'undefined' ? window.location.host : 'topproductofficial.com'}/{product.slug}
                        </span>
                        
                        <svg className="w-5 h-5 text-blue-900 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>

                      {/* Pixel Validation Badge */}
                      {product.google_ads_id ? (
                          <div className="group relative w-fit">
                              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full cursor-help">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-bold text-green-700 tracking-wide">PIXEL ACTIVE</span>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                                  <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-mono">
                                      ID: {product.google_ads_id}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full w-fit">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs font-bold text-yellow-700 tracking-wide">NO PIXEL</span>
                          </div>
                      )}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-3">
                    <Link 
                        href={`/admin/products/${product.slug}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-md text-black font-black hover:bg-gray-100 hover:border-gray-400 hover:text-blue-700 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        EDIT
                    </Link>
                    
                    <button 
                        onClick={() => handleDelete(product.slug, product.name)}
                        disabled={deleting === product.slug}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-200 rounded-md text-red-700 font-black hover:bg-red-50 hover:border-red-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait"
                    >
                        {deleting === product.slug ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                        DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
