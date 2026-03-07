'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Checking settings...');

  useEffect(() => {
    const refreshToken = searchParams.get('refresh_token');

    if (refreshToken) {
        setStatus('Saving Google Ads Token...');
        
        // Save to .env.local via API
        fetch('/api/admin/system/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: refreshToken })
        })
        .then(async (res) => {
            if (res.ok) {
                setStatus('Token Saved! Redirecting to Ads Manager...');
                // Give it a moment to propagate
                setTimeout(() => {
                    router.push('/admin/ads-manager');
                }, 1500);
            } else {
                setStatus('Failed to save token manually. Check console.');
            }
        })
        .catch(err => {
            console.error(err);
            setStatus('Error saving token.');
        });
    } else {
        setStatus('Settings Page');
    }
  }, [searchParams, router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white p-6 rounded shadow border">
          <p className="text-lg text-blue-600 font-medium flex items-center gap-2">
              {status === 'Token Saved! Redirecting to Ads Manager...' && (
                  <span className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></span>
              )}
              {status}
          </p>
          
          {/* Debug Info */}
          <div className="mt-8 text-xs text-gray-400">
              Environment: {process.env.NODE_ENV}
          </div>
      </div>
    </div>
  );
}
