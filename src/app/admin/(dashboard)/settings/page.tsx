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
        setDetails({ error: 'Network Error', details: err.message });
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

        {/* Action Button */}
        <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">
                If the connection is failing or the token has expired, you can generate a new one.
                Make sure you have added your <code>GOOGLE_ADS_CLIENT_ID</code> and <code>GOOGLE_ADS_CLIENT_SECRET</code> to Vercel first.
            </p>
            <a 
                href="/api/admin/oauth/google"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
            >
                🔄 Generate New Refresh Token
            </a>
        </div>
      </div>
    </div>
  );
}
