import { NextResponse } from 'next/server';
import { GoogleAds } from '@/lib/googleAds';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Attempt to list customers to verify connection
        const customers = await GoogleAds.listAccessibleCustomers();
        
        return NextResponse.json({ 
            status: 'ONLINE', 
            message: 'Connection verified successfully',
            customers: customers.length
        });
    } catch (e: any) {
        console.error('[GoogleAds] Verification Failed:', e);
        return NextResponse.json({ 
            status: 'OFFLINE', 
            error: e.message,
            hint: 'Token might be expired or invalid. Please reconnect.'
        }, { status: 500 });
    }
}
