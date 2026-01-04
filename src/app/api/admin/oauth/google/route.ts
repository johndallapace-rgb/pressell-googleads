import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  
  if (!clientId) {
      return NextResponse.json({ error: 'Missing GOOGLE_ADS_CLIENT_ID in env' }, { status: 500 });
  }

  // Determine Redirect URI
  // In Production (Vercel), host might be internal, so we enforce the public domain if not localhost
  const host = request.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost');
  const protocol = isLocal ? 'http' : 'https';
  
  // FIX: Force the exact production domain for consistency with Google Console
  const domain = isLocal ? host : 'topproductofficial.com';
  const redirectUri = `${protocol}://${domain}/api/admin/oauth/callback`;

  // Scopes for Google Ads
  const scopes = [
    'https://www.googleapis.com/auth/adwords'
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Critical for Refresh Token
    prompt: 'consent' // Force consent to ensure refresh token is returned
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
