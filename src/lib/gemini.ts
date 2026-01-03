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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
