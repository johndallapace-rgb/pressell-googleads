import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signToken(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return;

  // Refresh token expiration if valid
  const parsed = await verifyToken(token);
  if (!parsed) return;

  const res = NextResponse.next();
  res.cookies.set({
    name: 'admin_token',
    value: token,
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return res;
}
