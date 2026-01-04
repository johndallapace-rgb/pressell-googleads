import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
      return NextResponse.json({ error: `Google OAuth Error: ${error}` }, { status: 400 });
  }

  if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Client ID or Secret' }, { status: 500 });
  }

  // Determine Redirect URI (Must match init)
  const host = request.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost');
  const protocol = isLocal ? 'http' : 'https';
  
  // FIX: Force the exact production domain for consistency with Google Console
  const domain = isLocal ? host : 'topproductofficial.com';
  const redirectUri = `${protocol}://${domain}/api/admin/oauth/callback`;

  try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code'
          })
      });

      const data = await tokenRes.json();

      if (!tokenRes.ok) {
          return NextResponse.json({ error: data.error, details: data.error_description }, { status: 400 });
      }

      const refreshToken = data.refresh_token;

      if (!refreshToken) {
          return NextResponse.json({ 
              error: 'No Refresh Token returned.', 
              hint: 'Did you revoke access? Try clearing permissions in Google Account or use prompt=consent.' 
          }, { status: 400 });
      }

      // Redirect back to settings with token
      return NextResponse.redirect(`${protocol}://${host}/admin/settings?refresh_token=${refreshToken}`);

  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
