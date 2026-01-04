'use client';

import { useState } from 'react';

export default function GeminiTestButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTest = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/diagnostics/test-gemini', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message); // Should be "Connection Successful"
      } else {
        setStatus('error');
        setMessage(data.error || 'Connection failed');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message);
    }
  };

  return (
    <div>
      <button 
        onClick={handleTest}
        disabled={status === 'loading'}
        className={`w-full px-3 py-2 rounded text-sm font-bold transition-colors ${
            status === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
            status === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
            'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {status === 'loading' ? 'Testing...' : status === 'success' ? '✅ Connected' : '⚡ Test Connection'}
      </button>
      {message && (
          <p className={`text-xs mt-2 font-mono p-1 rounded ${
              status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
              {message}
          </p>
      )}
    </div>
  );
}
