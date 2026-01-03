import { signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  // Simple comparison
  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Generate token
  const token = await signToken({ userId: 'admin', email: adminEmail });

  const response = NextResponse.json({ success: true });
  
  // Set cookie on parent domain to allow access across subdomains (if we wanted)
  // OR set on main domain only to centralize auth.
  // The request is to centralize admin on www.
  // So we set the domain to .topproductofficial.com to allow the cookie to be readable if we ever need it on subdomains,
  // OR just defaults to current domain.
  // Given the requirement: "Certifique-se de que o cookie de autenticação seja configurado para o domínio pai .topproductofficial.com"
  
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction ? '.topproductofficial.com' : undefined;

  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
    domain: domain // Enable cross-subdomain auth presence
  });

  return response;
}
