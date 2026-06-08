import { NextRequest, NextResponse } from 'next/server';
import { getSystemConfig, updateSystemConfig, SystemConfig } from '@/lib/server/config';
import { isAdminRequestAuthorized } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      const config = await getSystemConfig();
      return NextResponse.json(config);
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      const newConfig: SystemConfig = await request.json();
      
      // Basic Validation
      if (!newConfig.api_keys) newConfig.api_keys = {};
      if (!newConfig.google_ads) newConfig.google_ads = { customer_accounts: [] } as any;
      if (!Array.isArray((newConfig.google_ads as any).customer_accounts)) (newConfig.google_ads as any).customer_accounts = [];
      if (!Array.isArray((newConfig.google_ads as any).test_customer_accounts)) (newConfig.google_ads as any).test_customer_accounts = [];
      if (!Array.isArray((newConfig.google_ads as any).production_customer_accounts)) (newConfig.google_ads as any).production_customer_accounts = [];
      if ((newConfig.google_ads as any).access_level !== 'test' && (newConfig.google_ads as any).access_level !== 'production') (newConfig.google_ads as any).access_level = 'test';
      if ((newConfig.google_ads as any).execution_mode !== 'config_only' && (newConfig.google_ads as any).execution_mode !== 'read_only' && (newConfig.google_ads as any).execution_mode !== 'active') {
        (newConfig.google_ads as any).execution_mode = 'config_only';
      }
      const g = newConfig.google_ads as any;
      const requiredOk = !!(g?.developer_token && g?.client_id && g?.client_secret && g?.refresh_token && g?.manager_account_id);
      (newConfig.google_ads as any).config_valid = requiredOk;
      (newConfig.google_ads as any).last_validation_at = new Date().toISOString();
      if (!newConfig.platforms) newConfig.platforms = {};
      
      const success = await updateSystemConfig(newConfig);
      
      if (success) {
          return NextResponse.json({ success: true });
      } else {
          throw new Error('Failed to update system config');
      }
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
