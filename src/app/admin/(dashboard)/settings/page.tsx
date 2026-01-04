'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const newRefreshToken = searchParams.get('refresh_token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/verify-google-ads')
      .then(async res => {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
              return res.json();
          } else {
              const text = await res.text();
              throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
          }
      })
      .then(data => {
        if (data.error) {
          setStatus('error');
          setDetails(data);
        } else {
          setStatus('ok');
          setDetails(data);
        }
      })
      .catch(err => {
        setStatus('error');
        setDetails({ error: 'Connection Error', details: err.message });
      });
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Google Ads Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          Google Ads Integration
        </h2>

        {/* Status Indicator */}
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Connection Status</h3>
            {status === 'loading' && <div className="text-gray-500">Checking connection...</div>}
            
            {status === 'ok' && (
                <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200">
                    <p className="font-bold flex items-center gap-2">
                        ✅ Connected to Account {details?.customerId}
                    </p>
                    <div className="mt-2 text-xs">
                        <p><strong>Conversion Actions Found:</strong> {details?.conversions?.length || 0}</p>
                        <ul className="list-disc pl-4 mt-1">
                            {details?.conversions?.map((c: any) => (
                                <li key={c.id}>{c.name} ({c.status})</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-red-50 text-red-800 p-4 rounded border border-red-200">
                    <p className="font-bold mb-1">❌ Connection Failed</p>
                    <p className="text-sm">{details?.error}</p>
                    {details?.hint && <p className="text-xs mt-2 italic">{details.hint}</p>}
                </div>
            )}
        </div>

        {/* New Token Success Message */}
        {newRefreshToken && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm leading-5 font-medium text-yellow-800">
                            New Refresh Token Generated
                        </h3>
                        <div className="mt-2 text-sm leading-5 text-yellow-700">
                            <p>
                                Please copy this token and update the <code>GOOGLE_ADS_REFRESH_TOKEN</code> variable in your Vercel Project Settings.
                            </p>
                            <div className="mt-3">
                                <code className="block bg-white p-2 rounded border border-yellow-200 break-all select-all font-mono text-xs">
                                    {newRefreshToken}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Helper Info for OAuth Configuration */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 text-sm">
            <h3 className="font-bold text-gray-700 mb-2">⚙️ OAuth Configuration Help</h3>
            <p className="mb-2">
                If you see a <strong>redirect_uri_mismatch</strong> error, add this URI to your Google Cloud Console (APIs & Services {'>'} Credentials {'>'} OAuth 2.0 Client IDs):
            </p>
            <code className="block bg-white p-2 rounded border border-gray-300 mb-4 select-all font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/admin/oauth/callback` : 'https://your-domain.com/api/admin/oauth/callback'}
            </code>
            
            <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="mb-2 font-bold text-gray-600">Alternative: Manual Token Generation</p>
                <p className="mb-2">
                    If you cannot update the console immediately, use the <strong>OAuth Playground</strong> with your Client ID/Secret to get a Refresh Token manually:
                </p>
                <a 
                    href="https://developers.google.com/oauthplayground/?scope=https://www.googleapis.com/auth/adwords&response_type=code&access_type=offline&approval_prompt=force"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                    Open Google OAuth Playground 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                <p className="text-xs text-gray-500 mt-1">
                    (Click "Settings" icon ⚙️ inside Playground {'>'} check "Use your own OAuth credentials" {'>'} Paste your Client ID/Secret)
                </p>
            </div>
        </div>

        {/* Manual Token Entry */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 mt-4">
             <h3 className="font-bold text-gray-700 mb-2">⌨️ Manual Token Override</h3>
             <p className="text-sm text-gray-600 mb-2">
                 If you used OAuth Playground, paste the generated <code>Refresh Token</code> here to verify it instantly.
             </p>
             <div className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder="1//0e..." 
                    className="flex-1 border p-2 rounded text-sm font-mono"
                    onChange={(e) => {
                        // Just a visual helper to copy
                    }}
                 />
                 <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-bold disabled:opacity-50" disabled>
                     Copy to Vercel
                 </button>
             </div>
             <p className="text-xs text-orange-600 mt-2 font-bold">
                 Note: You must still paste this into Vercel Environment Variables manually.
             </p>
        </div>

        {/* Action Button */}
        <div className="border-t pt-4 flex gap-4">
            <a 
                href="/api/admin/oauth/google"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
            >
                🔄 Generate New Refresh Token
            </a>
            
            <button 
                onClick={() => {
                    setStatus('loading');
                    fetch('/api/admin/verify-google-ads', { cache: 'no-store' })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                setStatus('error');
                                setDetails(data);
                            } else {
                                setStatus('ok');
                                setDetails(data);
                            }
                        })
                        .catch(err => {
                            setStatus('error');
                            setDetails({ error: 'Retry Failed', details: err.message });
                        });
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
            >
                ⚡ Force API Reconnect
            </button>
        </div>
      </div>
    </div>
  );
}
