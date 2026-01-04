import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  try {
    // Manually fetch models list using the REST API to bypass SDK strictness
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Failed to list models: ${res.status} ${res.statusText} - ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ models: data.models });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
