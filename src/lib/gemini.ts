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
    // Attempt to use the latest stable pro model alias with high creativity (0.8).
    // If this fails, the API Key likely needs "Generative Language API" enabled in Google Cloud Console.
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro-latest',
        generationConfig: {
            temperature: 0.8
        }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API Error Full:', JSON.stringify(error, null, 2));
    
    // Detailed Diagnostics
    if (error.message?.includes('404')) {
        throw new Error('Model not found (404). Action: Enable "Generative Language API" in Google Cloud Console for this API Key project. Also check if "gemini-1.5-pro-latest" is supported in your region.');
    }
    if (error.message?.includes('400')) {
        throw new Error('Bad Request (400). Action: Check if your API Key has restricted quotas or regions.');
    }
    
    throw error;
  }
}
    if (error.message?.includes('401') || error.message?.includes('API key')) {
        throw new Error('Invalid API Key (401). Please check your GEMINI_API_KEY in Vercel.');
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error('Quota Exceeded (429). You have hit the rate limit for Gemini.');
    }
    
    throw error;
  }
}
