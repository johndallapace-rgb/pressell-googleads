import { getSystemConfig } from './config';

export async function findOfficialUrl(productName: string): Promise<string | null> {
    try {
        const config = await getSystemConfig();
        const apiKey = config.api_keys?.google_search_key;
        const cx = config.api_keys?.google_search_cx;

        if (!apiKey || !cx) {
            console.warn('[WebSearch] Google Search API keys missing. Skipping fallback search.');
            return null;
        }

        const query = `${productName} official site`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            // Filter results to avoid obvious review sites if possible (simple heuristic)
            // But usually "official site" query brings the real one to top.
            const firstResult = data.items[0].link;
            console.log(`[WebSearch] Found potential official URL for ${productName}: ${firstResult}`);
            return firstResult;
        }

        return null;
    } catch (e) {
        console.error('[WebSearch] Error:', e);
        return null;
    }
}
