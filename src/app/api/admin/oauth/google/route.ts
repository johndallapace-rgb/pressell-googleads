import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  
  if (!clientId) {
      return NextResponse.json({ error: 'Missing GOOGLE_ADS_CLIENT_ID in env' }, { status: 500 });
  }

  // Determine Redirect URI dynamically based on request
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/admin/oauth/callback`;

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
