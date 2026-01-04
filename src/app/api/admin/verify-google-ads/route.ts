import { NextRequest, NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const customerId = '338-031-9096';
    
    // Check Env Vars
    if (!process.env.GOOGLE_ADS_REFRESH_TOKEN || !process.env.GOOGLE_ADS_CLIENT_ID) {
        throw new Error('Missing Environment Variables (GOOGLE_ADS_REFRESH_TOKEN)');
    }

    // Check conversions
    const conversions = await GoogleAds.listConversionActions(customerId);
    
    // Check if our label exists in the list (indirectly)
    // Note: The API returns the Conversion Action Name, not the Label (like 'DPCo...').
    // The Label 'DPCo...' is usually part of the tag snippet but maps to a Conversion Action ID.
    // We can list names and see if 'Purchase' or similar exists.
    
    return NextResponse.json({
        customerId,
        status: 'Access OK',
        conversions: conversions.map(c => ({ name: c.name, status: c.status, id: c.id }))
    });

  } catch (error: any) {
    console.error('[VerifyGoogleAds] Error:', error);
    
    // Improved Error Hints based on message
    let hint = 'Check GOOGLE_ADS_REFRESH_TOKEN and permissions for account 338-031-9096';
    if (error.message?.includes('invalid_client')) hint = 'Your GOOGLE_ADS_CLIENT_ID or SECRET is incorrect.';
    if (error.message?.includes('invalid_grant')) hint = 'Your REFRESH_TOKEN is expired or revoked. Generate a new one.';
    if (error.message?.includes('unauthorized_client')) hint = 'The OAuth Client is not authorized for this scope.';

    return NextResponse.json({ 
        error: error.message || 'Unknown Error',
        details: JSON.stringify(error, Object.getOwnPropertyNames(error)), // Capture stack/etc
        hint
    }, { status: 500 });
  }
}
