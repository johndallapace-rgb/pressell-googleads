'use client';

import { useState } from 'react';

type AIToolMode = 'engineer' | 'architect' | 'bug-hunter' | 'performance' | 'seo' | 'health' | 'logs' | 'fix' | 'inspector';

export default function AIToolsRunner() {
  const [loading, setLoading] = useState<AIToolMode | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async (mode: AIToolMode) => {
    setLoading(mode);
    setResult(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : '';
      
      const res = await fetch('/api/admin/debug/export-pack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode }) // Send mode to API
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult(data.message || 'Generation successful.');
      } else {
        setResult(`Error: ${data.error || 'Generation failed'}`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const copyPrompt = () => {
      // Try to fetch the generated prompt content if possible, or use the static template
      const prompt = `Act as a Senior Software Architect and Debug Engineer.

I am providing an "AI Debug Pack" zip file containing:
- system-structure.json (Project Map)
- system-flows.md (Data Flow Documentation)
- logs/ (Recent Local Debug Logs)
- debug-pack.json (Manifest)

Your task:
1. Analyze the architecture to understand the system.
2. Identify routing or KV inconsistencies in the flows.
3. Detect potential causes of offline products or errors in logs.
4. Check for missing keys, ghost keys, or slug mismatches.
5. Suggest safe fixes without breaking the system.
6. Point to the exact files or flows involved.

Prioritize safe, minimal changes.
Avoid refactoring large parts of the system unless absolutely necessary.

## Bug Context Template
Bug: 
Tested slug: 
Does the URL open in browser: 
Did admin mark it offline: 
Was Repair Keys used: 
Environment: localhost or production`;

      navigator.clipboard.writeText(prompt);
      alert('Prompt copied to clipboard!');
  };

  return (
    <div className="space-y-6">
        
        {/* Status Message */}
        {result && (
            <div className={`p-3 rounded text-sm font-bold ${result.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {result}
            </div>
        )}

        {/* AI ENGINEER MODE (Primary) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 font-bold rounded-bl">READY</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">AI Engineer Mode</h2>
            <p className="text-gray-600 text-sm mb-6">
                Generate a complete technical debug package for deep ChatGPT analysis, including system structure, flows, and local logs.
            </p>
            
            <div className="flex gap-2">
                <button
                    onClick={() => handleGenerate('engineer')}
                    disabled={!!loading}
                    className={`px-4 py-2 rounded text-xs font-bold text-white transition-colors ${
                    loading === 'engineer' ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                    {loading === 'engineer' ? 'GENERATING...' : 'GENERATE DEBUG PACK'}
                </button>
                <button
                    onClick={() => handleGenerate('prompt')}
                    disabled={!!loading}
                    className={`px-4 py-2 rounded text-xs font-bold text-white transition-colors ${
                    loading === 'prompt' ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {loading === 'prompt' ? '...' : 'ANALYZE WITH CHATGPT'}
                </button>
                <button 
                    onClick={copyPrompt}
                    className="px-4 py-2 rounded text-xs font-bold text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors"
                >
                    COPY ENGINEER PROMPT
                </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-4 italic">
                * Best option for debugging bugs, routing issues, KV mismatches, and production failures.
            </p>
        </div>

        {/* SECONDARY TOOLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ARCHITECT */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Architect</h3>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">ARCHITECTURE</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Generate an architecture summary with core modules, dependencies, flows, extension points, and structural risks.
                </p>
                <button
                    onClick={() => handleGenerate('architect')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {loading === 'architect' ? '...' : 'GENERATE ARCHITECTURE REPORT'}
                </button>
            </div>

            {/* SYSTEM HEALTH */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-teal-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI System Health Monitor</h3>
                    <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-bold">MONITOR</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Review critical system components (KV, Checker, Logs) and detect unhealthy states safely.
                </p>
                <button
                    onClick={() => handleGenerate('health')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 transition-colors"
                >
                    {loading === 'health' ? '...' : 'GENERATE HEALTH REPORT'}
                </button>
            </div>

            {/* LOG ANALYZER */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Log Analyzer</h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">ANALYSIS</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Scan local engineering logs and summarize suspicious events, failures, and likely root-cause zones.
                </p>
                <button
                    onClick={() => handleGenerate('logs')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                >
                    {loading === 'logs' ? '...' : 'ANALYZE LOGS'}
                </button>
            </div>

            {/* BUG HUNTER */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-red-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Bug Hunter</h3>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">DIAGNOSTICS</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Build a guided bug report with suspicious zones, recent failures, observability gaps, and likely root-cause areas.
                </p>
                <button
                    onClick={() => handleGenerate('bug-hunter')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                    {loading === 'bug-hunter' ? '...' : 'GENERATE BUG REPORT'}
                </button>
            </div>

            {/* FIX SUGGESTIONS */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-cyan-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Fix Suggestions</h3>
                    <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-bold">REPAIR</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Generate safe engineering recommendations based on current logs and observed system failures.
                </p>
                <button
                    onClick={() => handleGenerate('fix')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 transition-colors"
                >
                    {loading === 'fix' ? '...' : 'SUGGEST FIXES'}
                </button>
            </div>

            {/* PERFORMANCE */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Performance</h3>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">ANALYSIS</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Review sensitive paths, runtime costs, KV usage, checker overhead, and performance safety points.
                </p>
                <button
                    onClick={() => handleGenerate('performance')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
                >
                    {loading === 'performance' ? '...' : 'GENERATE PERFORMANCE REPORT'}
                </button>
            </div>

            {/* SEO */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-green-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI SEO Optimizer</h3>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">PLANNED</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Map SEO fields, metadata flows, and future optimization opportunities for presell visibility and conversion.
                </p>
                <button
                    onClick={() => handleGenerate('seo')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 transition-colors"
                >
                    {loading === 'seo' ? '...' : 'GENERATE SEO REPORT'}
                </button>
            </div>

            {/* PRODUCT INSPECTOR */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-pink-300 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">AI Product Inspector</h3>
                    <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-bold">INSPECTOR</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 h-12">
                    Inspect a product’s structure, routing, metadata, and readiness. (Placeholder: Targets last active).
                </p>
                <button
                    onClick={() => handleGenerate('inspector')}
                    disabled={!!loading}
                    className="w-full py-2 rounded text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 transition-colors"
                >
                    {loading === 'inspector' ? '...' : 'INSPECT PRODUCT'}
                </button>
            </div>
        </div>
    </div>
  );
}
