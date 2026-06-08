import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { getSystemConfig } from '@/lib/server/config';
import { GEMINI_DEFAULT_MODEL, GEMINI_PREMIUM_MODEL } from '@/lib/ai/model-config';
import { aiCache } from '@/lib/ai/ai-cache';
import { kvMonitor } from '@/lib/server/kv-monitor';
import 'server-only';

// AVISO: Todas as APIs devem ser consumidas via Config System UI
// WARNING: All APIs must be consumed via Config System UI. Do not use process.env.

export interface GenerateOptions {
    model?: string;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    skipCache?: boolean; // Option to force fresh generation
}

// In-flight request deduplication
const pendingAiRequests = new Map<string, Promise<string>>();

export async function generateContent(prompt: string, options: GenerateOptions = {}) {
  // 0. Cache Check
  const selectedModel = options.model || GEMINI_DEFAULT_MODEL;
  const cacheKey = await aiCache.generateKey(prompt, selectedModel, options);
  
  // Deduplication Key: Include model to be safe
  const dedupeKey = `ai_req:${cacheKey}`;

  if (!options.skipCache) {
      // 1. Check Memory/KV Cache
      const cached = await aiCache.get(cacheKey);
      if (cached) {
          // Track "AI Cache Hit" via Monitor (we can add a specific method later or reuse read)
          kvMonitor.trackRead(true, false); 
          console.log('[Gemini] Cache Hit for prompt');
          return cached;
      }
      
      // 2. Check In-Flight Deduplication
      if (pendingAiRequests.has(dedupeKey)) {
          console.log('[Gemini] Request deduplicated (waiting for pending)');
          return pendingAiRequests.get(dedupeKey) as Promise<string>;
      }
  }

  // 1. Priority: System Config (KV) - User Control via UI
  let apiKey: string | undefined;
  
  try {
      const config = await getSystemConfig();
      apiKey = config.api_keys?.gemini;
  } catch (e) {
      console.warn('Failed to load system config for Gemini Key', e);
  }

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING'); // Specific code for detection
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Wrap the generation in a promise for deduplication
  const generationPromise = (async () => {
      try {
        const generationConfig: GenerationConfig = {
            temperature: options.temperature ?? 0.7,
            topP: options.topP,
            maxOutputTokens: options.maxOutputTokens
        };

        // The Google Cloud Generative Language API is now fully active.
        const model = genAI.getGenerativeModel(
            { 
                model: selectedModel,
                generationConfig
            },
            { apiVersion: 'v1' }
        );
        
        console.log(`[Gemini] Requesting model: ${model.model} (API v1)`);
        
        // Debug log for key verification (safe partial log)
        if (apiKey) {
            // console.log('[Gemini] Using API Key starting with:', apiKey.substring(0, 8) + '...');
        } else {
            console.error('[Gemini] CRITICAL: API Key is empty/undefined during request!');
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Store in Cache (if successful)
            if (text && !options.skipCache) {
                await aiCache.set(cacheKey, text);
            }
            
            return text;
        } catch (firstError: any) {
            // Retry logic for 404 (Model Not Found / Propagation Delay)
            if (firstError.message?.includes('404')) {
                console.warn('[Gemini] 404 encountered. Retrying in 2 seconds to allow for API propagation...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const retryResult = await model.generateContent(prompt);
                const retryResponse = await retryResult.response;
                const text = retryResponse.text();
                
                if (text && !options.skipCache) {
                    await aiCache.set(cacheKey, text);
                }
                
                return text;
            }
            
            // Rate Limit Handling (429)
            if (firstError.message?.includes('429') || firstError.status === 429) {
                 console.warn('[Gemini] 429 Rate Limit. Backing off for 5s...');
                 await new Promise(resolve => setTimeout(resolve, 5000));
                 // Simple one-time retry for now
                 const retryResult = await model.generateContent(prompt);
                 const text = await retryResult.response.text();
                 return text;
            }
            
            throw firstError;
        }
      } catch (error: any) {
        console.error('Gemini API Error Full:', JSON.stringify(error, null, 2));
        
        // Pass through the raw error message for better debugging in the frontend
        const rawMessage = error.message || 'Unknown Error';
        
        // Detailed Diagnostics
        if (rawMessage.includes('404')) {
            throw new Error(`Model not found (404). Raw: ${rawMessage} - Action: Enable "Generative Language API" in Google Cloud Console.`);
        }
        if (rawMessage.includes('400')) {
            throw new Error(`Bad Request (400). Raw: ${rawMessage} - Action: Check API Key quotas/regions.`);
        }
        if (rawMessage.includes('401') || rawMessage.includes('API key')) {
            // Updated error message to reflect Config System
            throw new Error('Invalid API Key (401). Check Config System.');
        }
        if (rawMessage.includes('429') || rawMessage.includes('quota')) {
            throw new Error(`Quota Exceeded (429). Raw: ${rawMessage}`);
        }
        
        // Fallback: Throw the raw message so the user sees "PERMISSION_DENIED" etc.
        throw new Error(`Gemini API Error: ${rawMessage}`);
      } finally {
          // Cleanup pending request
          pendingAiRequests.delete(dedupeKey);
      }
  })();

  // Store promise for deduplication
  pendingAiRequests.set(dedupeKey, generationPromise);
  
  return generationPromise;
}

/**
 * Premium Refinement Helper
 * Explicitly uses the Premium (Pro) model for high-quality final polish.
 * Use this sparingly to avoid rate limits.
 */
export async function refineWithPremiumModel(prompt: string, options: Omit<GenerateOptions, 'model'> = {}) {
    console.log('[Gemini] Triggering PREMIUM Refinement...');
    return generateContent(prompt, { ...options, model: GEMINI_PREMIUM_MODEL });
}
