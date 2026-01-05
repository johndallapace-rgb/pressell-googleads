'use client';

import { useState, useEffect } from 'react';

export default function GeminiStatusBadge() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch('/api/admin/diagnostics/test-gemini', { method: 'POST' });
        if (res.ok) {
            setStatus('connected');
        } else {
            setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    }
    checkConnection();
  }, []);

  if (status === 'checking') {
      return <span className="text-xs font-mono text-gray-500 animate-pulse">Checking AI...</span>;
  }

  if (status === 'connected') {
      return (
          <div className="flex items-center gap-1.5 bg-green-100 border border-green-200 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-700">Gemini v1 Connected</span>
          </div>
      );
  }

  return (
      <div className="flex items-center gap-1.5 bg-red-100 border border-red-200 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span className="text-xs font-bold text-red-700">AI Disconnected</span>
      </div>
  );
}
