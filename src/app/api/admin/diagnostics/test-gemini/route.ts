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
    const prompt = "Say 'Connection Successful' if you receive this.";
    const response = await generateContent(prompt);
    
    return NextResponse.json({ success: true, message: response });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
