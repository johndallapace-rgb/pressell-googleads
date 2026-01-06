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
      <div className="bg-slate-900 p-5 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">MY PRODUCTS</h2>
        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded border border-slate-700">
            {products.length} Active
        </span>
      </div>
      
      {products.length === 0 ? (
        <div className="p-12 text-center bg-gray-50">
          <p className="text-gray-500 text-lg">No products found.</p>
          <p className="text-sm text-gray-400 mt-2">Use "Market Trends" to spy and create one!</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-widest border-b border-gray-200">Product & Market</th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-widest border-b border-gray-200">Live Status</th>
              <th className="px-6 py-4 text-right text-xs font-black text-slate-700 uppercase tracking-widest border-b border-gray-200">Management</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.slug} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 shadow-sm text-3xl">
                        {getFlag(product.language)}
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900 tracking-tight">{product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                                {product.vertical}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                                {product.slug}
                            </span>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <a 
                    href={`/${product.slug}`} 
                    target="_blank" 
                    className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all w-fit"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${product.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${product.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    </span>
                    
                    <span className="text-sm font-bold text-blue-700 font-mono group-hover:text-blue-800">
                        {typeof window !== 'undefined' ? window.location.host : 'topproductofficial.com'}/{product.slug}
                    </span>
                    
                    <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-3">
                    <Link 
                        href={`/admin/products/${product.slug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                    </Link>
                    
                    <button 
                        onClick={() => handleDelete(product.slug, product.name)}
                        disabled={deleting === product.slug}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 rounded-md text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait"
                    >
                        {deleting === product.slug ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                        Delete
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
