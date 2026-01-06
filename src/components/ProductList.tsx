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

  const handleDelete = async (slug: string) => {
      if (!confirm(`Are you sure you want to PERMANENTLY delete "${slug}"?\nThis will remove the page, config, images, and ads.`)) return;
      
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">My Products</h2>
      </div>
      
      {products.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No products found. Use "Market Trends" to spy and create one!
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Live Link (Pre-sell)</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.slug} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4 drop-shadow-sm">{getFlag(product.language)}</span>
                    <div>
                        <div className="text-base font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{product.vertical}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a 
                    href={`/${product.slug}`} 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2 font-mono group"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${product.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} title={product.status === 'active' ? 'Online' : 'Offline'}></span>
                    {typeof window !== 'undefined' ? window.location.host : ''}/{product.slug}
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3 items-center">
                  <Link 
                    href={product.slug ? `/admin/products/${product.slug}` : '#'}
                    className={`text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-4 py-2 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors ${!product.slug ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    ✏️ Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(product.slug)}
                    disabled={deleting === product.slug}
                    className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleting === product.slug ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
