'use client';

import { useState } from 'react';

type AIToolMode = 'engineer' | 'architect' | 'bug-hunter' | 'performance' | 'seo' | 'health' | 'logs' | 'fix' | 'inspector';

export default function AIEngineerModeButton() {
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
      const prompt = `Act as a Senior Software Architect. I am providing an AI Debug Pack (zip). Analyze system-structure.json, system-flows.md, and logs. Diagnose issues and suggest safe fixes.`;
      navigator.clipboard.writeText(prompt);
      alert('Prompt copied to clipboard!');
  };

  // This component is now primarily used for the Engineer Mode Card
  // but we can expose the individual handlers if we refactor.
  // For now, let's keep this as the "Legacy" Button Group for backward compatibility or direct use,
  // BUT since the new UI uses individual buttons in cards, we should probably 
  // expose a generic "AIActionRunner" component or just use this one as a hidden utility?
  
  // Actually, the request implies "Use cards, buttons..." in the PAGE.
  // So the PAGE component will likely implement the layout, and maybe call this component?
  // OR this component updates to support all modes?
  
  // Let's stick to the request: "Create these as AI Engineering tools inside /admin/ai-engineering"
  // So I will update the PAGE file to have the layout, and use a new or updated component for the actions.
  
  // To keep it simple and clean, I will make this component just a wrapper for the API call logic
  // and export a reusable "AIToolButton" component? No, "DO NOT refactor".
  
  // I will just update this component to support all new modes in its internal list if needed, 
  // but the page likely needs to call `handleGenerate` directly? 
  // Client Components cannot export functions easily to Server Components (Page).
  
  // Better plan: The Page will have Client Components for each card?
  // Or I expand THIS component to render the whole "Tools Grid" if I want to keep it simple?
  // The user said: "RECOMMENDED SECTION ORDER... 1. Engineer... 2. Architect..."
  
  // I will leave this component as is (supporting the new types) and let the Page file orchestrate the layout 
  // by importing a new client component or using this one creatively?
  // Actually, I'll update the PAGE file to include the UI and logic directly or via a new Client Component.
  
  return (
    <div className="flex flex-col gap-4">
        {/* This component acts as the logic provider. 
            Ideally we'd refactor, but per rules, let's just expose the buttons here 
            OR make a new "AIToolsGrid" component.
        */}
        <div className="grid grid-cols-2 gap-2">
             {/* Existing buttons... */}
        </div>
    </div>
  );
}
// ... wait, I need to allow the Page to render these buttons in specific places.
// The previous implementation had the buttons inside this component.
// I will create a NEW Client Component `src/components/admin/AIToolsGrid.tsx` that implements the new full layout?
// Or just update `AIEngineerModeButton.tsx` to be `AIToolsPanel.tsx`?
// Let's rename/upgrade `AIEngineerModeButton.tsx` to handle the new UI requirements?
// No, "DO NOT refactor".

// I will create a NEW component `src/components/admin/AIActionButtons.tsx` that exports individual buttons 
// or a hook?
// Simplest safe path: Create `src/components/admin/AIToolsRunner.tsx` which is a Client Component 
// that renders the full grid of buttons/cards as requested.

