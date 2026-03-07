'use client';

import { useState, useEffect } from 'react';

interface ProductSummary {
  slug: string;
  name: string;
  vertical: string;
  language: string;
  status: string;
  template?: string;
}

export default function GlobalScalePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null); // slug being processed

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads/list?limit=100'); // Get all products
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleScale = async (slug: string, name: string, vertical: string) => {
    setProcessing(slug);
    const confirmScale = confirm(`🤖 Gemini AI: Escalar "${name}" para a Europa?\n\nIsso criará versões otimizadas para Alemanha, França e Espanha.`);
    
    if (!confirmScale) {
        setProcessing(null);
        return;
    }

    try {
        const res = await fetch('/api/admin/scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, productName: name, vertical })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const createdList = Array.isArray(data.createdProducts) ? data.createdProducts.join('\n') : 'Nenhuma variação retornada';
        alert(`🚀 Sucesso! Novas versões criadas:\n\n${createdList}`);
        fetchProducts(); // Refresh list

    } catch (e: any) {
        alert('Erro: ' + e.message);
    } finally {
        setProcessing(null);
    }
  };

  // Group by "Root" Product (assuming root has no dash-lang suffix or is 'en')
  // Simple heuristic: if slug ends with -de, -fr, -es, it's a child.
  const rootProducts = products.filter(p => !p.slug.match(/-(de|fr|es|it)$/));
  
  const getVariations = (rootSlug: string) => {
      return products.filter(p => p.slug.startsWith(rootSlug + '-') && p.slug !== rootSlug);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">🌍 Escala Global</h1>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
            💡 Dica: Produtos "Cookie Template" convertem 3x mais na Europa.
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Produto Base (Brasil/Global)</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Status da Escala</th>
                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">Carregando catálogo...</td></tr>
                ) : rootProducts.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">Nenhum produto base encontrado.</td></tr>
                ) : (
                    rootProducts.map(root => {
                        const variations = getVariations(root.slug);
                        const isProcessing = processing === root.slug;

                        return (
                            <tr key={root.slug} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{root.name}</div>
                                    <div className="text-xs text-gray-400">{root.slug}</div>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                        {root.vertical}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {variations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {variations.map(v => (
                                                <span key={v.slug} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    {v.slug.split('-').pop()?.toUpperCase()} 
                                                    {v.template === 'cookie' && ' 🍪'}
                                                    {v.template === 'editorial' && ' 📰'}
                                                    {v.template === 'story' && ' 📖'}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">Nenhuma variação criada</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleScale(root.slug, root.name, root.vertical)}
                                        disabled={isProcessing}
                                        className={`
                                            inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all
                                            ${isProcessing 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span> Processando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2">🚀</span> Escalar para Europa
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
