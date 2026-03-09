'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Fragment } from 'react';
import type { ProductConfig } from '@/lib/config';
import { FormInput } from '@/components/ui/FormInput';
import { FormSelect } from '@/components/ui/FormSelect';

interface ProductListProps {
  products: ProductConfig[];
}

// Helper: Get Flag Emoji
const getFlag = (lang: string) => {
    const flags: Record<string, string> = {
        en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇧🇷', pl: '🇵🇱', nl: '🇳🇱',
        ru: '🇷🇺', ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷'
    };
    return flags[lang?.toLowerCase().split('-')[0]] || '🌐';
};

// Helper: Get Real Link
const getRealLink = (product: ProductConfig) => {
    if (typeof window === 'undefined') return '#';
    
    // Check if product has a specific vertical that maps to a subdomain
    // This logic must match the generator and product creation flow
    const rootDomain = 'topproductofficial.com';
    let hostname = window.location.hostname;
    
    // In dev, we might be on localhost:3000
    if (hostname.includes('localhost')) {
        return `${window.location.origin}/${product.slug}`;
    }

    // In production, we use subdomains
    if (product.vertical && product.vertical !== 'other' && product.vertical !== 'general') {
        return `https://${product.vertical}.${rootDomain}/${product.slug}`;
    }
    
    return `https://${rootDomain}/${product.slug}`;
};

export default function ProductList({ products }: ProductListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [filterVertical, setFilterVertical] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'group'>('group');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, { domain: boolean; pixel: boolean; affiliate: boolean; ads: boolean; }>>({});
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const itemsPerPage = 20;

  // Toggle Group Expansion
  const toggleGroup = (baseSlug: string) => {
      const newSet = new Set(expandedGroups);
      if (newSet.has(baseSlug)) {
          newSet.delete(baseSlug);
      } else {
          newSet.add(baseSlug);
      }
      setExpandedGroups(newSet);
  };

  // Helper: Group Products
  const groupProducts = (productList: ProductConfig[]) => {
      const groups: Record<string, { base?: ProductConfig, global: ProductConfig[], factory: ProductConfig[] }> = {};
      
      // 1. Pass: Identify Base & Place Items
      productList.forEach(p => {
          let baseSlug = p.slug;
          let type: 'base' | 'global' | 'factory' = 'base';

          // Check Factory
          if ((p as any).is_generated && (p as any).base_slug) {
              baseSlug = (p as any).base_slug;
              type = 'factory';
          } 
          // Check Global (Suffix Heuristic)
          else if (p.slug.match(/-(de|fr|it|es)$/)) {
              baseSlug = p.slug.replace(/-(de|fr|it|es)$/, '');
              type = 'global';
          }

          if (!groups[baseSlug]) groups[baseSlug] = { global: [], factory: [] };

          if (type === 'base') groups[baseSlug].base = p;
          else if (type === 'global') groups[baseSlug].global.push(p);
          else if (type === 'factory') groups[baseSlug].factory.push(p);
      });

      // 2. Pass: Filter Groups based on Search/Filter (if needed)
      // Currently, we are grouping the *filtered* list, so this is automatic.
      return groups;
  };

  // Derived State: Filtered & Sorted Products
  const filteredProducts = products.filter(p => {
      // 1. Search
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.slug.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
      }
      // 2. Vertical
      if (filterVertical !== 'all' && p.vertical !== filterVertical) return false;
      // 3. Status
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      // 4. Type (Base vs Generated)
      if (filterType === 'base' && (p as any).is_generated) return false;
      if (filterType === 'factory' && !(p as any).is_generated) return false;
      
      return true;
  });

  // Pagination Logic
  // Grouping Logic (Applied to Filtered List)
  const groupedData = viewMode === 'group' ? groupProducts(filteredProducts) : {};
  const groupKeys = Object.keys(groupedData).sort();

  const totalPages = viewMode === 'list' 
      ? Math.ceil(filteredProducts.length / itemsPerPage)
      : Math.ceil(groupKeys.length / itemsPerPage);

  const paginatedList = viewMode === 'list'
      ? filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : []; // For list mode

  const paginatedGroups = viewMode === 'group'
      ? groupKeys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : []; // For group mode

  // Statistics for Summary Cards
  const stats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      factory: products.filter(p => (p as any).is_generated).length,
      offline: products.filter(p => p.status === 'offline' || p.status === 'paused').length
  };

  // Unique Verticals for Filter
  const verticals = Array.from(new Set(products.map(p => p.vertical).filter(Boolean)));

  // Handlers
  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    setDeleting(slug);
    try {
        const res = await fetch(`/api/admin/products?slug=${slug}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        router.refresh();
    } catch (error) {
        alert('Failed to delete product');
    } finally {
        setDeleting(null);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
        // Trigger self-heal or backfill
        const res = await fetch('/api/admin/debug/backfill');
        if (res.ok) {
            alert('Repair initiated. Check logs or refresh in a moment.');
            router.refresh();
        } else {
            alert('Repair failed.');
        }
    } catch (e) {
        alert('Repair error');
    } finally {
        setRepairing(false);
    }
  };

  const handleZip = () => {
    setZipping(true);
    window.location.href = '/api/admin/debug/export-pack';
    setTimeout(() => setZipping(false), 3000);
  };

  // Bulk Actions
  const toggleSelection = (slug: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(slug)) {
          newSet.delete(slug);
      } else {
          newSet.add(slug);
      }
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      // If all VISIBLE FACTORY items are selected, unselect all.
      // Otherwise, select all VISIBLE FACTORY items.
      
      const visibleFactoryItems = (viewMode === 'list' ? paginatedList : paginatedGroups.flatMap(key => groupedData[key].factory))
          .filter(p => (p as any).is_generated); // Safety check: ONLY select factory items
      
      const allSelected = visibleFactoryItems.length > 0 && visibleFactoryItems.every(p => selectedIds.has(p.slug));
      
      if (allSelected) {
          setSelectedIds(new Set());
      } else {
          const newSet = new Set(selectedIds);
          visibleFactoryItems.forEach(p => newSet.add(p.slug));
          setSelectedIds(newSet);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      
      // Safety Check: Verify all selected are FACTORY items
      const selectedItems = products.filter(p => selectedIds.has(p.slug));
      const hasBase = selectedItems.some(p => !(p as any).is_generated);
      
      if (hasBase) {
          alert('SAFETY ERROR: You cannot delete BASE products in bulk. Please unselect base products.');
          return;
      }

      if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected presell pages? This cannot be undone.`)) return;
      
      setIsBulkDeleting(true);
      try {
          // Sequential delete to avoid rate limits / race conditions
          for (const slug of Array.from(selectedIds)) {
              await fetch(`/api/admin/products?slug=${slug}`, { method: 'DELETE' });
          }
          
          setSelectedIds(new Set());
          router.refresh();
          alert(`Successfully deleted ${selectedIds.size} pages.`);
      } catch (e) {
          alert('Bulk delete failed partway through. Please refresh.');
      } finally {
          setIsBulkDeleting(false);
      }
  };

  // Helper: Render Row
  const renderRow = (product: ProductConfig, indented = false) => {
      const isFactory = (product as any).is_generated;
      const isSelected = selectedIds.has(product.slug);

      return (
      <tr key={product.slug || product.id} className={`hover:bg-blue-50 transition-colors duration-150 group ${indented ? 'bg-white' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
        {/* Column 0: Checkbox (Factory Only) */}
        <td className="pl-6 py-4 w-10">
            {isFactory ? (
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleSelection(product.slug)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
            ) : (
                <span className="text-gray-200 text-xs">🔒</span>
            )}
        </td>

        {/* Column 1: Product Identity */}
        <td className={`px-6 py-4 whitespace-nowrap ${indented ? 'pl-2 border-l-4 border-gray-100' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full border border-gray-200 text-lg">
                {getFlag(product.language)}
            </div>
            <div>
                <div className="text-sm font-bold text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500 font-mono">{product.slug}</div>
            </div>
          </div>
        </td>

        {/* Column 2: Type & Vertical */}
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col gap-1 items-start">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                    (product as any).is_generated 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                    {(product as any).is_generated ? 'FACTORY' : 'BASE'}
                </span>
                <span className="text-xs text-gray-500 font-medium">{product.vertical}</span>
            </div>
        </td>

        {/* Column 3: Status */}
        <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {product.status?.toUpperCase() || 'UNKNOWN'}
            </span>
        </td>

        {/* Column 4: Health & Links */}
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col gap-1.5">
                 {/* Link with Ping */}
                 <a 
                    href={getRealLink(product)} 
                    target="_blank" 
                    className="flex items-center gap-2 text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline"
                 >
                    <div className={`w-2 h-2 rounded-full ${statusMap[product.slug]?.domain ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    Open Link
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </a>
                 
                 {/* Pixel / Affiliate / Ads */}
                 <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                    <span className={statusMap[product.slug]?.pixel ? 'text-green-600' : 'text-gray-300'} title="Pixel">PXL</span>
                    <span className="text-gray-200">|</span>
                    <span className={statusMap[product.slug]?.affiliate ? 'text-green-600' : 'text-gray-300'} title="Affiliate Link">LNK</span>
                    <span className="text-gray-200">|</span>
                    <span className={statusMap[product.slug]?.ads ? 'text-green-600' : 'text-gray-300'} title="Ads">ADS</span>
                 </div>
            </div>
        </td>

        {/* Column 5: Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium pr-8 min-w-[180px]">
          <div className="flex flex-col gap-2 w-full max-w-[140px] ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
            <a 
                href={`https://topproductofficial.com/admin/products/${product.slug}`}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 hover:text-blue-700 transition-all shadow-sm text-xs w-full"
            >
                EDIT
            </a>
            
            <button 
                onClick={() => handleDelete(product.slug, product.name)}
                disabled={deleting === product.slug}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded text-red-600 font-bold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait text-xs w-full"
            >
                {deleting === product.slug ? '...' : 'DELETE'}
            </button>
          </div>
        </td>
      </tr>
      );
  };

  // Health Check Effect
  useEffect(() => {
    const checkHealth = async () => {
        // Determine current visible items
        let currentItems: ProductConfig[] = [];
        if (viewMode === 'list') {
            currentItems = paginatedList;
        } else {
            // Flatten groups for health check
            paginatedGroups.forEach(key => {
                const g = groupedData[key];
                if (g.base) currentItems.push(g.base);
                currentItems.push(...g.global);
                currentItems.push(...g.factory);
            });
        }

        // Only check visible products to save bandwidth
        const urls = currentItems
            .filter(p => p.status === 'active')
            .map(p => getRealLink(p));
        
        if (urls.length === 0) return;
        
        try {
            const res = await fetch('/api/admin/diagnostics/check-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls })
            });
            const data = await res.json();
            if (data.results) {
                const newMap: Record<string, any> = {};
                data.results.forEach((r: any) => {
                     const slug = r.url.split('/').pop();
                     if (slug) {
                         newMap[slug] = {
                             domain: r.ok,
                             pixel: r.ok, // Placeholder
                             affiliate: r.ok, // Placeholder
                             ads: r.ok // Placeholder
                         };
                     }
                });
                setStatusMap(prev => ({ ...prev, ...newMap }));
            }
        } catch (e) {
            console.error('Health check failed', e);
        }
    };
    
    // Debounce slightly to avoid rapid firing on page switch
    const timeout = setTimeout(checkHealth, 500);
    return () => clearTimeout(timeout);
  }, [paginatedList, paginatedGroups, viewMode]); // Dependency on visible items ensures we check new page

  return (
    <div className="space-y-6">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase">Total Products</p>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm bg-green-50">
              <p className="text-xs font-bold text-green-700 uppercase">Active Live</p>
              <p className="text-2xl font-black text-green-900">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm bg-blue-50">
              <p className="text-xs font-bold text-blue-700 uppercase">Factory Pages</p>
              <p className="text-2xl font-black text-blue-900">{stats.factory}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm bg-red-50">
              <p className="text-xs font-bold text-red-700 uppercase">Offline / Paused</p>
              <p className="text-2xl font-black text-red-900">{stats.offline}</p>
          </div>
      </div>

      {/* 2. Control Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg mr-2 animate-in fade-in slide-in-from-left-4 duration-200">
                      <span className="text-sm font-bold text-blue-800">{selectedIds.size} Selected</span>
                      <div className="h-4 w-px bg-blue-200 mx-1"></div>
                      <button 
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                      >
                          {isBulkDeleting ? (
                              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          )}
                          Delete Selected
                      </button>
                  </div>
              )}

              {/* Search */}
              <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </span>
                  <FormInput 
                      type="text" 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 w-full md:w-64"
                  />
              </div>

              {/* Filters */}
              <FormSelect 
                  value={filterVertical} 
                  onChange={(e) => setFilterVertical(e.target.value)}
                  className="bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                  <option value="all">All Verticals</option>
                  {verticals.map(v => <option key={v} value={v}>{v}</option>)}
              </FormSelect>

              <FormSelect 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="offline">Offline</option>
              </FormSelect>

              <FormSelect 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                  <option value="all">All Types</option>
                  <option value="base">Base Products</option>
                  <option value="factory">Factory Generated</option>
              </FormSelect>

              {/* View Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      List
                  </button>
                  <button
                      onClick={() => setViewMode('group')}
                      className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === 'group' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Group
                  </button>
              </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2">
             <button onClick={handleRepair} disabled={repairing} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded" title="Repair Keys">
                <svg className={`w-5 h-5 ${repairing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
             <button onClick={handleZip} disabled={zipping} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded" title="Debug Pack">
                <svg className={`w-5 h-5 ${zipping ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             </button>
             <Link href="/admin/products/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-2 shadow-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Product
             </Link>
          </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left w-10">
                <input 
                    type="checkbox" 
                    onChange={toggleSelectAll}
                    checked={selectedIds.size > 0}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    title="Select all visible Factory pages"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Links & Health</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {viewMode === 'list' ? (
                paginatedList.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No products found matching filters.
                        </td>
                    </tr>
                ) : (
                    paginatedList.map((product) => renderRow(product))
                )
            ) : (
                paginatedGroups.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No product groups found.
                        </td>
                    </tr>
                ) : (
                    paginatedGroups.map((baseSlug) => {
                        const group = groupedData[baseSlug];
                        const isExpanded = expandedGroups.has(baseSlug);
                        const baseProduct = group.base;
                        const displayName = baseProduct ? baseProduct.name : baseSlug;
                        
                        return (
                            <Fragment key={baseSlug}>
                                {/* Group Header */}
                                <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer border-b border-gray-200 transition-colors" onClick={() => toggleGroup(baseSlug)}>
                                    <td colSpan={6} className="px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`transform transition-transform text-gray-400 font-bold ${isExpanded ? 'rotate-90' : ''}`}>
                                                    ▶
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 text-sm">
                                                        {displayName}
                                                    </span>
                                                    {baseProduct && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">BASE</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    {group.global.length > 0 && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">GLOBAL: {group.global.length}</span>}
                                                    {group.factory.length > 0 && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono font-bold">FACTORY: {group.factory.length}</span>}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                {baseSlug}
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Group Content */}
                                {isExpanded && (
                                    <>
                                        {/* Base Product Row */}
                                        {baseProduct && renderRow(baseProduct, true)}
                                        
                                        {/* Global Section */}
                                        {group.global.length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase pl-16 border-l-4 border-purple-200">
                                                        Global Scale Pages ({group.global.length})
                                                    </td>
                                                </tr>
                                                {group.global.map(p => renderRow(p, true))}
                                            </>
                                        )}

                                        {/* Factory Section */}
                                        {group.factory.length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase pl-16 border-l-4 border-green-200">
                                                        Presell Factory Pages ({group.factory.length})
                                                    </td>
                                                </tr>
                                                {group.factory.map(p => renderRow(p, true))}
                                            </>
                                        )}
                                    </>
                                )}
                            </Fragment>
                        );
                    })
                )
            )}
          </tbody>
        </table>
        
        {/* 4. Pagination */}
        {filteredProducts.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-bold">{filteredProducts.length}</span> results
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded bg-white text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded bg-white text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
