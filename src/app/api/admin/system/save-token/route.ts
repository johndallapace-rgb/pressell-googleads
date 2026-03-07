import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();
        
        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        if (envContent.includes('GOOGLE_ADS_REFRESH_TOKEN=')) {
            envContent = envContent.replace(
                /GOOGLE_ADS_REFRESH_TOKEN=.*/,
                `GOOGLE_ADS_REFRESH_TOKEN=${token}`
            );
        } else {
            envContent += `\nGOOGLE_ADS_REFRESH_TOKEN=${token}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('[System] Saved Google Ads Refresh Token to .env.local');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[System] Failed to save token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
