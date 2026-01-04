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
    // Use 'gemini-1.5-flash' which is the latest efficient model. 
    // If you encounter 404s, ensure your API Key has access to this model in Google AI Studio.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Enhance Error Message
    if (error.message?.includes('404')) {
        throw new Error('Model not found (404). Check if "gemini-1.5-flash" is enabled in your API Key or try "gemini-pro".');
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
