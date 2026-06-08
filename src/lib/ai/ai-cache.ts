import { kvCache } from '@/lib/server/kv-cache';

/**
 * AI Cache Layer
 * Prevents redundant API calls by caching responses based on prompt + model hash.
 */

// Cache TTL: 24 Hours for AI responses (content is relatively static)
const AI_CACHE_TTL = 24 * 60 * 60 * 1000;

export const aiCache = {
    /**
     * Generate a deterministic cache key for the prompt
     * Uses Web Crypto API for Edge compatibility
     */
    async generateKey(prompt: string, model: string, options: any = {}): Promise<string> {
        // Normalize prompt: trim, collapse spaces
        const normalizedPrompt = prompt.trim().replace(/\s+/g, ' ');
        
        // Create stable signature of options
        const optionsSig = JSON.stringify({
            model,
            temperature: options.temperature,
            topP: options.topP,
            maxOutputTokens: options.maxOutputTokens
        });

        const msgBuffer = new TextEncoder().encode(`${normalizedPrompt}|${optionsSig}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
        return `ai_cache:${hashHex}`;
    },

    /**
     * Try to get cached response
     */
    async get(key: string): Promise<string | null> {
        return kvCache.get<string>(key, 'ai_cache', AI_CACHE_TTL);
    },

    /**
     * Store response in cache
     */
    async set(key: string, response: string): Promise<void> {
        await kvCache.set(key, response, 'ai_cache', AI_CACHE_TTL);
    }
};
