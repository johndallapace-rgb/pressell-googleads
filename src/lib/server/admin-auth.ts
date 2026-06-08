import 'server-only';

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function isAdminRequestAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (bearerToken && process.env.ADMIN_TOKEN && bearerToken === process.env.ADMIN_TOKEN) {
    return true;
  }

  const cookieToken = request.cookies.get('admin_token')?.value;
  if (!cookieToken) {
    return false;
  }

  return !!(await verifyToken(cookieToken));
}
