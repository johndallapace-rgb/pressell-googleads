import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';
import { getSystemConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getSystemConfig();
    const apiKey = config.api_keys?.gemini;
    if (apiKey) {
        console.log('[Gemini-Test] Testing with key:', apiKey.substring(0, 8) + '...');
    } else {
        console.log('[Gemini-Test] No key found in config.');
    }

    const prompt = "Say 'Connection Successful' if you receive this.";
    console.log('[Gemini-Test] Prompting...');
    
    // Set a timeout for the generation to avoid hanging
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API Timeout (10s)')), 10000));
    const generatePromise = generateContent(prompt);
    
    const response = await Promise.race([generatePromise, timeoutPromise]) as string;
    
    console.log('[Gemini-Test] Response received:', response ? response.substring(0, 50) + '...' : 'Empty');
    
    return NextResponse.json({ success: true, message: response });
  } catch (error: any) {
    console.error('[Gemini-Test] Error:', error);
    
    if (error.message?.includes('GEMINI_API_KEY_MISSING')) {
        return NextResponse.json({ success: false, error: 'NOT_CONFIGURED' });
    }
    return NextResponse.json({ success: false, error: error.message || 'Unknown Gemini Error' }, { status: 500 });
  }
}
