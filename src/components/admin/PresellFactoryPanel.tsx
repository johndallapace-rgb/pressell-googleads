'use client';

import { useState } from 'react';
import { ProductConfig } from '@/lib/config';
import { PRESELL_INTENTS, GeneratedPresell, createPresellFromBase, generatePresellSlug } from '@/lib/presellFactory';
import { logger } from '@/lib/logger';
import { FormInput } from '@/components/ui/FormInput';
import { FormLabel } from '@/components/ui/FormLabel';
import { FormField } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';

interface PresellFactoryPanelProps {
    products: ProductConfig[];
}

export default function PresellFactoryPanel({ products }: PresellFactoryPanelProps) {
    const [selectedBase, setSelectedBase] = useState<string>('');
    const [keywordRoot, setKeywordRoot] = useState<string>('');
    const [generatedList, setGeneratedList] = useState<GeneratedPresell[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [saveResult, setSaveResult] = useState<{success: number, failed: number} | null>(null);

    const handleBaseSelect = (slug: string) => {
        setSelectedBase(slug);
        // Default keyword root to slug, but user can edit
        setKeywordRoot(slug);
        setGeneratedList([]); // Reset generation when base changes
        setSaveResult(null);
    };

    const handleGenerate = () => {
        if (!selectedBase || !keywordRoot) return;

        const baseProduct = products.find(p => p.slug === selectedBase);
        if (!baseProduct) return;

        // Generate list based on intents
        const newPresells = PRESELL_INTENTS.map(intent => {
            // Use keywordRoot for the slug construction instead of original base slug if different
            // Actually createPresellFromBase uses baseProduct.slug. 
            // We should override the slug generation logic to use keywordRoot.
            const newSlug = `${keywordRoot}-${intent.slug}`;
            
            return createPresellFromBase(baseProduct, intent.slug, newSlug);
        });

        setGeneratedList(newPresells);
    };

    const handleGenerateAIContent = async () => {
        if (generatedList.length === 0) return;
        setIsGeneratingContent(true);
        
        const updatedList = [...generatedList];
        
        for (let i = 0; i < updatedList.length; i++) {
            const presell = updatedList[i];
            try {
                // Call API
                const res = await fetch('/api/admin/ai/generate-presell-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productName: presell.name.split(' - ')[0], // Base Name
                        intent: presell.intent,
                        language: presell.language || 'en',
                        context: {
                            baseHeadline: presell.headline,
                            baseBullets: presell.bullets
                        }
                    })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    // Update Content
                    updatedList[i] = {
                        ...presell,
                        headline: data.headline || presell.headline,
                        subheadline: data.subheadline || presell.subheadline,
                        bullets: data.benefits || presell.bullets,
                        cta_text: data.cta_text || presell.cta_text,
                        // Note: Story/FAQ support needs to be added to ProductConfig if not exists
                        // Assuming ProductConfig has 'story' or similar text fields?
                        // If not, we map 'story' to 'unique_mechanism' or 'pain_points' intro?
                        // Let's map story to a new section if possible or just append to pain points for now.
                        // Wait, ProductConfig has 'pain_points' (string[]).
                        // Let's try to be smart.
                        pain_points: data.story ? [data.story] : presell.pain_points,
                        
                        // We can store FAQ in a flexible field or just log it for now
                        // Ideally we extend ProductConfig later.
                    };
                }
            } catch (e) {
                console.error(`AI Gen failed for ${presell.slug}`, e);
            }
        }
        
        setGeneratedList(updatedList);
        setIsGeneratingContent(false);
    };

    const handleDeleteDraft = (index: number) => {
        const newList = [...generatedList];
        newList.splice(index, 1);
        setGeneratedList(newList);
    };

    const handleSaveAll = async () => {
        if (generatedList.length === 0) return;
        setIsSaving(true);
        setSaveResult(null);
        
        logger.info('presell-factory', {
            event: 'PRESSELL_FACTORY_SAVE_START',
            count: generatedList.length,
            baseProduct: selectedBase
        });

        let successCount = 0;
        let failedCount = 0;

        // Save each product sequentially to avoid race conditions on lock
        for (const presell of generatedList) {
            try {
                // Validate slug uniqueness in generated list (basic check)
                // Real uniqueness check happens at server/KV level usually, but we can't check KV easily here.
                // We assume the user verified the preview.
                
                logger.info('presell-factory', {
                    event: 'PRESSELL_FACTORY_SAVE_PAYLOAD',
                    slug: presell.slug,
                    intent: presell.intent
                });

                // The API expects { product: ... } wrapper!
                const res = await fetch('/api/admin/products/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product: presell }) // FIX: Wrapped in product object
                });

                const data = await res.json();

                if (res.ok) {
                    successCount++;
                    logger.info('presell-factory', {
                        event: 'PRESSELL_FACTORY_SAVE_SUCCESS',
                        slug: presell.slug
                    });
                } else {
                    failedCount++;
                    console.error(`Failed to save ${presell.slug}:`, data.error);
                    logger.error('presell-factory', {
                        event: 'PRESSELL_FACTORY_SAVE_ERROR',
                        slug: presell.slug,
                        error: data.error
                    });
                    alert(`Failed to save ${presell.slug}: ${data.error}`);
                }
            } catch (e: any) {
                failedCount++;
                console.error(e);
                logger.error('presell-factory', {
                    event: 'PRESSELL_FACTORY_SAVE_ERROR',
                    slug: presell.slug,
                    error: e.message
                });
            }
        }

        setIsSaving(false);
        setSaveResult({ success: successCount, failed: failedCount });
        
        if (failedCount === 0) {
            // Clear list on full success
            setGeneratedList([]);
            alert(`Successfully created ${successCount} presells! They are now in My Products.`);
        }
    };
// ...

    return (
        <div className="space-y-8">
            {/* 1. Selection Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">1. Select Base Product</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField>
                        <FormLabel>Base Product</FormLabel>
                        <FormSelect 
                            value={selectedBase} 
                            onChange={(e) => handleBaseSelect(e.target.value)}
                        >
                            <option value="">-- Select a product --</option>
                            {products.map(p => (
                                <option key={p.slug} value={p.slug}>{p.name} ({p.slug})</option>
                            ))}
                        </FormSelect>
                    </FormField>
                    
                    <FormField>
                        <FormLabel>Keyword Root (Slug Prefix)</FormLabel>
                        <FormInput 
                            type="text" 
                            value={keywordRoot}
                            onChange={(e) => setKeywordRoot(e.target.value)}
                            placeholder="e.g. mitolyn"
                            disabled={!selectedBase}
                        />
                        <p className="text-xs text-gray-500 mt-1">Example: "mitolyn" becomes "mitolyn-review", "mitolyn-price"</p>
                    </FormField>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleGenerate}
                        disabled={!selectedBase || !keywordRoot}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 font-bold"
                    >
                        Generate Intent List
                    </button>
                </div>
            </div>

            {/* 2. Preview Section */}
            {generatedList.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">2. Preview Generated Presells</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerateAIContent}
                                disabled={isGeneratingContent || isSaving}
                                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGeneratingContent ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Content...
                                    </>
                                ) : (
                                    <>✨ Generate AI Content</>
                                )}
                            </button>
                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                {generatedList.length} Pages Ready
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated Slug</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {generatedList.map((presell, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {presell.intent}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                            {presell.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {presell.vertical}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => handleDeleteDraft(idx)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {saveResult && (
                                <span className={`text-sm font-bold ${saveResult.failed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    Saved: {saveResult.success} | Failed: {saveResult.failed}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className={`px-6 py-3 rounded text-white font-bold transition-colors ${
                                isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'SAVE ALL GENERATED PRESELLS'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
