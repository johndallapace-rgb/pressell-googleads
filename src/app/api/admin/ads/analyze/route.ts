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

      IMPORTANT: Also generate specific Responsive Search Ad (RSA) assets for this product based on the logs/context provided.
      
      OUTPUT FORMAT:
      Start with your Analysis (3-5 bullets).
      Then, output a strictly formatted JSON block at the end (wrapped in \`\`\`json) containing:
      {
        "headlines": ["Headline 1", "Headline 2", ...], (Generate exactly 15 headlines, max 25 chars each)
        "descriptions": ["Desc 1", "Desc 2", ...], (Generate exactly 4 descriptions, max 90 chars each)
      }

      CRITICAL CONSTRAINTS:
      - Headlines MUST be 25 characters or less (Google limit is 30, use 25 for safety).
      - Descriptions MUST be 90 characters or less.
      - DO NOT use exclamation marks (!) in headlines.
      - DO NOT use "Click Here".
      - DO NOT use "Best" or superlative claims.
      
      LOGS/CONTEXT:
      ${logs.substring(0, 5000)}
    `;

    const analysis = await generateContent(prompt);
    
    // Extract JSON block if present
    let rsaAssets = null;
    try {
        const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            rsaAssets = JSON.parse(jsonMatch[1]);
        }
    } catch (e) {
        console.warn('Failed to parse RSA assets from AI response', e);
    }

    return NextResponse.json({ analysis, rsaAssets });

  } catch (error: any) {
    console.error('Log analysis failed:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
