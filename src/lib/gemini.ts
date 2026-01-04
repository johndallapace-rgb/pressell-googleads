import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
// Ensure process.env.GEMINI_API_KEY is set in your .env.local
const apiKey = process.env.GEMINI_API_KEY;

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateContent(prompt: string) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    // Use the simple 'gemini-1.5-flash' model name.
    // Explicitly set apiVersion to 'v1' to avoid beta issues.
    const model = genAI.getGenerativeModel(
        { 
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.8
            }
        },
        { apiVersion: 'v1' }
    );
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
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
