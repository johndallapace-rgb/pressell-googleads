'use client';

import { useState } from 'react';

export default function ListModelsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleList = async () => {
    setStatus('loading');
    setError('');
    setModels([]);
    try {
      const res = await fetch('/api/admin/diagnostics/list-models', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok && data.models) {
        setStatus('success');
        setModels(data.models);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to fetch models');
      }
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <button 
        onClick={handleList}
        disabled={status === 'loading'}
        className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded text-xs font-bold hover:bg-gray-200 border border-gray-300"
      >
        {status === 'loading' ? 'Listing...' : '📋 List Available Models'}
      </button>
      
      {error && (
          <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded break-all font-mono">
              {error}
          </p>
      )}

      {models.length > 0 && (
          <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-gray-500 mb-1">Available Models:</p>
              <ul className="space-y-1">
                  {models.map((m: any) => (
                      <li key={m.name} className="text-xs font-mono text-gray-700 break-all">
                          {m.name.replace('models/', '')}
                      </li>
                  ))}
              </ul>
          </div>
      )}
    </div>
  );
}
