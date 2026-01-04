import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { logs } = await request.json();

    if (!logs || typeof logs !== 'string') {
      return NextResponse.json({ error: 'Logs content is required' }, { status: 400 });
    }

    const prompt = `
      You are a Senior Google Ads Analyst. Analyze the following campaign logs/metrics and provide actionable optimization advice.
      
      Focus on:
      1. CTR improvements (if low)
      2. Conversion Rate Optimization (CRO)
      3. Cost efficiency
      4. Keyword relevance

      Format your response as a concise list of 3-5 high-impact actions.
      
      LOGS:
      ${logs.substring(0, 5000)}
    `;

    const analysis = await generateContent(prompt);

    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error('Log analysis failed:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
