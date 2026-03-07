'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Asset = {
    id: string;
    productId: string;
    productName: string;
    type: 'image' | 'video';
    url: string;
    label: string;
    notes: string;
    createdAt: number;
};

type ProductSimple = {
    slug: string;
    name: string;
};

export default function AssetManagerPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [products, setProducts] = useState<ProductSimple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newAsset, setNewAsset] = useState({
        productId: '',
        type: 'image' as 'image' | 'video',
        url: '',
        label: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stored Assets
            const resAssets = await fetch('/api/admin/assets');
            const dataAssets = await resAssets.json();
            
            // 2. Fetch Products for Dropdown
            const resConfig = await fetch('/api/admin/config');
            const config = await resConfig.json();
            const productList = Object.entries(config.products || {}).map(([key, p]: [string, any]) => ({
                slug: p.slug || key,
                name: p.name || key
            }));
            setProducts(productList);

            if (Array.isArray(dataAssets)) {
                setAssets(dataAssets);
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAsset.productId || !newAsset.url) return;

        const selectedProduct = products.find(p => p.slug === newAsset.productId);
        
        try {
            const res = await fetch('/api/admin/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newAsset,
                    productName: selectedProduct?.name || newAsset.productId
                })
            });
            
            if (res.ok) {
                const added = await res.json();
                setAssets([added, ...assets]);
                setIsAdding(false);
                setNewAsset({ productId: '', type: 'image', url: '', label: '', notes: '' });
            }
        } catch (e) {
            alert('Failed to add asset');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try {
            await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' });
            setAssets(assets.filter(a => a.id !== id));
        } catch (e) {
            alert('Failed to delete');
        }
    };
    
    const handleUpdateNote = async (id: string, notes: string) => {
        // Optimistic update
        const oldAssets = [...assets];
        setAssets(assets.map(a => a.id === id ? { ...a, notes } : a));
        
        try {
            await fetch(`/api/admin/assets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
        } catch (e) {
            setAssets(oldAssets); // Revert
        }
    };

    // Group assets by Product
    const groupedAssets = assets.reduce((acc, asset) => {
        if (!acc[asset.productName]) acc[asset.productName] = [];
        acc[asset.productName].push(asset);
        return acc;
    }, {} as Record<string, Asset[]>);

    // Filter Groups
    const filteredGroups = Object.entries(groupedAssets).filter(([name, group]) => {
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               group.some(a => a.label.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        🎨 Asset Manager
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your creative library. Track performance and reuse high-converting assets.
                    </p>
                </div>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                    >
                        <span>+</span> Add Asset
                    </button>
                </div>
            </div>

            {/* Add Asset Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Add New Asset Link</h3>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleAddAsset} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAsset.productId}
                                    onChange={e => setNewAsset({ ...newAsset, productId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a Product...</option>
                                    {products.map(p => (
                                        <option key={p.slug} value={p.slug}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newAsset.type}
                                        onChange={e => setNewAsset({ ...newAsset, type: e.target.value as any })}
                                    >
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. White Background"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newAsset.label}
                                        onChange={e => setNewAsset({ ...newAsset, label: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asset URL (Link Only)</label>
                                <input 
                                    type="url" 
                                    placeholder="https://..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAsset.url}
                                    onChange={e => setNewAsset({ ...newAsset, url: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Paste the direct link to the image or video. No file uploads.
                                    <br/>
                                    <span className="text-blue-600">Tip: Right-click an image on Amazon/Sales Page and choose "Copy Image Address".</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Performance Notes (Optional)</label>
                                <textarea 
                                    placeholder="e.g. Best CTR on Mobile (3.5%)"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                                    value={newAsset.notes}
                                    onChange={e => setNewAsset({ ...newAsset, notes: e.target.value })}
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg mt-4"
                            >
                                Save to Library
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Library Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading library...</div>
            ) : filteredGroups.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">No assets found.</p>
                    <button onClick={() => setIsAdding(true)} className="text-blue-600 font-bold hover:underline">Add your first asset</button>
                </div>
            ) : (
                <div className="space-y-12">
                    {filteredGroups.map(([productName, group]) => (
                        <div key={productName} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                📦 {productName}
                                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{group.length} assets</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {group.map(asset => (
                                    <div key={asset.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                        {/* Preview */}
                                        <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100">
                                            {asset.type === 'image' ? (
                                                <Image 
                                                    src={asset.url} 
                                                    alt={asset.label}
                                                    fill
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-red-600 bg-black/5">
                                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                </div>
                                            )}
                                            
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                                                <button 
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="bg-white p-2 rounded-full shadow-md text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${asset.type === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {asset.type}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(asset.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <h4 className="font-bold text-gray-800 truncate mb-1" title={asset.label}>{asset.label || 'Untitled Asset'}</h4>
                                            
                                            {/* Notes / Performance */}
                                            <div className="mt-3">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Performance / Notes</label>
                                                <textarea 
                                                    className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 mt-1 focus:bg-white focus:border-blue-300 outline-none transition-colors resize-none h-16"
                                                    placeholder="Add notes (e.g. CTR 3%)..."
                                                    defaultValue={asset.notes}
                                                    onBlur={(e) => handleUpdateNote(asset.id, e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                                 <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[150px]">
                                                     View Source ↗
                                                 </a>
                                                 <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(asset.url);
                                                        alert('Link copied!');
                                                    }}
                                                    className="text-xs font-bold text-gray-500 hover:text-gray-800"
                                                 >
                                                     Copy Link
                                                 </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
