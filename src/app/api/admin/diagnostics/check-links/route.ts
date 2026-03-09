import { NextRequest, NextResponse } from 'next/server';
import { getCampaignConfig, ensureCanonicalKeys } from '@/lib/config';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'; // Change to Node for logger fs access

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
                // Try finding by slug property if key doesn't match
                let product: any = null;
                
                // Direct key lookup? No, slug might not be key.
                // Scan all products for matching slug
                product = Object.values(products).find((p: any) => p.slug === slug);

                if (product) {
                    // Skip checking if product is NOT active (offline, paused, draft)
                    // We treat it as "OK" or "Skipped" to avoid false alarms in dashboard
                    if (product.status !== 'active') {
                        logger.info('checker', {
                            event: 'CHECK_LINKS_SKIPPED_NON_PUBLIC',
                            slug,
                            status: product.status
                        });
                        return { 
                            url, 
                            status: 0, 
                            ok: true, 
                            skipped: true, 
                            reason: `Status is ${product.status}` 
                        };
                    }

                    // Fire-and-forget self-heal check
                    // We don't await this to keep the check fast
                    ensureCanonicalKeys(product, 'Checker-SelfHeal').catch(e => console.error(e));
                }
            } catch (e) {
                // Ignore URL parsing errors
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                // Use GET instead of HEAD. Some frameworks/Next.js/Vercel block HEAD or treat it differently.
                // GET is safer to simulate real browser behavior.
                const res = await fetch(url, { 
                    method: 'GET', 
                    signal: controller.signal,
                    headers: { 
                        'User-Agent': 'PressellBot/1.0',
                        'Cache-Control': 'no-cache, no-store',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                });
                clearTimeout(timeoutId);
                
                // Allow 2xx and 3xx. 
                // Also, if it's a 405 (Method Not Allowed) it might mean HEAD failed but GET would pass, 
                // but since we switched to GET, 405 shouldn't happen for a public page.
                // However, 403 Forbidden or 503 Service Unavailable might happen if bot protection is on.
                
                const isOk = res.ok || (res.status >= 200 && res.status < 400);
                
                if (!isOk) {
                    console.log(`[CheckLink] Failed: ${url} -> ${res.status}`);
                    logger.warn('checker', { 
                        event: 'CHECKER_OFFLINE', 
                        url, 
                        status: res.status,
                        statusText: res.statusText
                    });
                } else {
                     // Log successes locally for debug
                     logger.info('checker', { 
                        event: 'CHECKER_ONLINE', 
                        url, 
                        status: res.status 
                     });
                }

                return { url, status: res.status, ok: isOk };
            } catch (e: any) {
                logger.error('checker', { event: 'CHECKER_ERROR', url, error: e.message });
                return { url, status: 0, ok: false, error: e.message };
            }
        }));

        return NextResponse.json({ results });

    } catch (error: any) {
        logger.error('checker', { event: 'CHECKER_CRASH', error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
