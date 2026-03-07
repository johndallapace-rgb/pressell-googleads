import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemConfig } from '@/lib/config';

// AVISO: Todas as APIs devem ser consumidas via Config System UI
// WARNING: All APIs must be consumed via Config System UI. Do not use process.env.

// Removed static initialization to allow dynamic key loading

export async function generateContent(prompt: string) {
  // 1. Priority: System Config (KV) - User Control via UI
  let apiKey: string | undefined;
  
  try {
      const config = await getSystemConfig();
      apiKey = config.api_keys?.gemini;
  } catch (e) {
      console.warn('Failed to load system config for Gemini Key', e);
  }

  // 2. Fallback: process.env (Legacy/Dev) - DISABLED per user request
  // The system must rely strictly on the Config System.
  // if (!apiKey) {
  //    apiKey = process.env.GEMINI_API_KEY;
  // }

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING'); // Specific code for detection
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Use 'gemini-2.0-flash' on v1 (stable).
    // The Google Cloud Generative Language API is now fully active.
    const model = genAI.getGenerativeModel(
        { 
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7
            }
        },
        { apiVersion: 'v1' }
    );
    
    console.log('[Gemini] Requesting model:', model.model, 'API Version: v1');
    
    // Debug log for key verification (safe partial log)
    if (apiKey) {
        console.log('[Gemini] Using API Key starting with:', apiKey.substring(0, 8) + '...');
    } else {
        console.error('[Gemini] CRITICAL: API Key is empty/undefined during request!');
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (firstError: any) {
        // Retry logic for 404 (Model Not Found / Propagation Delay)
        if (firstError.message?.includes('404')) {
            console.warn('[Gemini] 404 encountered. Retrying in 2 seconds to allow for API propagation...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const retryResult = await model.generateContent(prompt);
            const retryResponse = await retryResult.response;
            return retryResponse.text();
        }
        throw firstError;
    }
  } catch (error: any) {
    console.error('Gemini API Error Full:', JSON.stringify(error, null, 2));
    
    // Pass through the raw error message for better debugging in the frontend
    const rawMessage = error.message || 'Unknown Error';
    const status = error.status || error.response?.status;
    
    // Detailed Diagnostics
    if (rawMessage.includes('404')) {
        throw new Error(`Model not found (404). Raw: ${rawMessage} - Action: Enable "Generative Language API" in Google Cloud Console.`);
    }
    if (rawMessage.includes('400')) {
        throw new Error(`Bad Request (400). Raw: ${rawMessage} - Action: Check API Key quotas/regions.`);
    }
    if (rawMessage.includes('401') || rawMessage.includes('API key')) {
        // Updated error message to reflect Config System
        throw new Error(`Invalid API Key (401). Key: ${apiKey?.substring(0,8)}... - Check Config System.`);
    }
    if (rawMessage.includes('429') || rawMessage.includes('quota')) {
        throw new Error(`Quota Exceeded (429). Raw: ${rawMessage}`);
    }
    
    // Fallback: Throw the raw message so the user sees "PERMISSION_DENIED" etc.
    throw new Error(`Gemini API Error: ${rawMessage}`);
  }
}
