import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const kvUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.REDIS_REST_API_URL;
        const kvToken = process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_API_TOKEN;

        if (!kvUrl || !kvToken) {
            return NextResponse.json({ 
                status: 'error', 
                message: 'Missing Environment Variables',
                hasUrl: !!kvUrl,
                hasToken: !!kvToken
            }, { status: 500 });
        }

        const kv = createClient({
            url: kvUrl,
            token: kvToken,
            automaticDeserialization: true,
            // @ts-ignore
            fetchOptions: { cache: 'no-store', next: { revalidate: 0 } }
        });

        // 1. Write Test
        const testKey = 'test:123';
        const testValue = { timestamp: Date.now(), status: 'alive' };
        await kv.set(testKey, testValue);

        // 2. Read Test
        const readValue = await kv.get(testKey);

        // 3. List Keys
        const keys = await kv.keys('*');

        // 4. Read Campaign Config Summary (Keys inside)
        const config: any = await kv.get('campaign_config');
        let productKeys: string[] = [];
        if (config && config.products) {
            productKeys = Object.keys(config.products);
        }

        return NextResponse.json({
            status: 'success',
            testWriteRead: JSON.stringify(testValue) === JSON.stringify(readValue) ? 'PASSED' : 'FAILED',
            kvKeys: keys,
            campaignConfigProductKeys: productKeys,
            envCheck: {
                urlStart: kvUrl.substring(0, 10) + '...',
                tokenStart: kvToken.substring(0, 5) + '...'
            }
        });

    } catch (e: any) {
        return NextResponse.json({
            status: 'error',
            error: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}
