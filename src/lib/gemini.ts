import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
// Ensure process.env.GEMINI_API_KEY is set in your .env.local
// IMPORTANT: Use standard API Key (starts with 'AIza...'), NOT Service Account JSON.
const apiKey = process.env.GEMINI_API_KEY;

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateContent(prompt: string) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    // Use 'gemini-1.5-flash' on v1 (stable).
    // The Google Cloud Generative Language API is now fully active.
    const model = genAI.getGenerativeModel(
        { 
            model: 'gemini-1.5-flash',
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
        throw new Error(`Invalid API Key (401). Raw: ${rawMessage} - Check GEMINI_API_KEY in Vercel.`);
    }
    if (rawMessage.includes('429') || rawMessage.includes('quota')) {
        throw new Error(`Quota Exceeded (429). Raw: ${rawMessage}`);
    }
    
    // Fallback: Throw the raw message so the user sees "PERMISSION_DENIED" etc.
    throw new Error(`Gemini API Error: ${rawMessage}`);
  }
}
