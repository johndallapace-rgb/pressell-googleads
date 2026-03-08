import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, ensureCanonicalKeys } from '@/lib/config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { urls } = await req.json();
        const config = await getCampaignConfig();
        const products = config.products || {};

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 });
        }

        const results = await Promise.all(urls.map(async (url: string) => {
            // ... fetch logic ...
            // SELF-HEAL TRIGGER
            // If we can identify the product from the URL, try to ensure its keys
            try {
                // Extract slug from URL (e.g. health.site.com/slug)
                const urlObj = new URL(url);
                const slug = urlObj.pathname.replace(/^\/|\/$/g, ''); // trim slashes
                
                // Find product in config
                let product = products[slug];
                // Try finding by slug property if key doesn't match
                if (!product) {
                    product = Object.values(products).find(p => p.slug === slug) as any;
                }

                if (product) {
                    // Fire-and-forget self-heal check
                    // We don't await this to keep the check fast
                    ensureCanonicalKeys(product, 'Checker-SelfHeal').catch(e => console.error(e));
                }
            } catch (e) {
                // Ignore URL parsing errors
            }

            try {
                const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8s
            
            // Log for debugging
            // console.log(`[CheckLink] Pinging: ${url}`);

            const res = await fetch(url, { 
                method: 'HEAD', 
                signal: controller.signal,
                headers: { 
                    'User-Agent': 'PressellBot/1.0',
                    'Cache-Control': 'no-cache, no-store' // Bypass Vercel Cache
                }
            });
            clearTimeout(timeoutId);
            
            // Allow 200, 301, 302, 307, 308
            const isOk = res.ok || (res.status >= 300 && res.status < 400);
            
            if (!isOk) {
                console.log(`[CheckLink] Failed: ${url} -> ${res.status}`);
            }

            return { url, status: res.status, ok: isOk };
        } catch (e: any) {
            return { url, status: 0, ok: false, error: e.message };
        }
    }));

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
