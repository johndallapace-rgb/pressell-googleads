import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

type GoogleAdsOAuthToken = { access_token: string; expires_in: number; token_type: string };

const GOOGLE_ADS_API_VERSION = 'v19';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com';
const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';

function digitsOnly(s: any) {
  return String(s || '').replace(/[^0-9]/g, '');
}

function hasValue(v: any) {
  return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v;
}

function maskId(id: string) {
  const d = digitsOnly(id);
  if (!d) return '';
  if (d.length <= 4) return `****${d}`;
  return `${'*'.repeat(Math.max(0, d.length - 4))}${d.slice(-4)}`;
}

async function getAccessToken(args: { client_id: string; client_secret: string; refresh_token: string }) {
  const body = new URLSearchParams();
  body.set('client_id', args.client_id);
  body.set('client_secret', args.client_secret);
  body.set('refresh_token', args.refresh_token);
  body.set('grant_type', 'refresh_token');

  const res = await fetch(GOOGLE_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const text = await res.text();
  let data: GoogleAdsOAuthToken | null = null;
  try {
    data = text ? (JSON.parse(text) as any) : null;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.access_token) {
    throw new Error(`google_ads_oauth_refresh_failed:${res.status}`);
  }

  return data.access_token;
}

async function googleAdsMutate(args: {
  customer_id: string;
  endpoint: string;
  operations: any[];
  developer_token: string;
  access_token: string;
  login_customer_id?: string;
  validate_only: true;
}) {
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers/${digitsOnly(args.customer_id)}/${args.endpoint}:mutate`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${args.access_token}`,
    'developer-token': args.developer_token,
    'Content-Type': 'application/json',
  };
  if (hasValue(args.login_customer_id)) headers['login-customer-id'] = digitsOnly(args.login_customer_id);

  const body: any = { operations: args.operations, validateOnly: true };

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg = parsed?.error?.message || `google_ads_mutate_failed:${res.status}`;
    throw new Error(msg);
  }

  return parsed;
}

async function googleAdsGet(args: { path: string; developer_token: string; access_token: string; login_customer_id?: string }) {
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/${args.path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${args.access_token}`,
    'developer-token': args.developer_token,
  };
  if (hasValue(args.login_customer_id)) headers['login-customer-id'] = digitsOnly(args.login_customer_id);

  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg = parsed?.error?.message || `google_ads_get_failed:${res.status}`;
    throw new Error(msg);
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    const authHeader = request.headers.get('Authorization');
    if ((!token || !(await verifyToken(token))) && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const discover_only = body?.discover_only === true;

    const cfg = await getCampaignConfig();

    const client_id = process.env.GOOGLE_ADS_CLIENT_ID || '';
    const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
    const developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
    const refresh_token =
      (typeof (cfg as any)?.system?.google_ads?.refresh_token === 'string' ? (cfg as any).system.google_ads.refresh_token : '') ||
      (typeof (cfg as any)?.system?.api_keys?.google_ads_refresh_token === 'string'
        ? (cfg as any).system.api_keys.google_ads_refresh_token
        : '') ||
      (process.env.GOOGLE_ADS_REFRESH_TOKEN || '');

    if (!client_id || !client_secret || !developer_token || !refresh_token) {
      return NextResponse.json(
        {
          error: 'missing_google_ads_credentials',
          readiness: {
            client_id_present: !!client_id,
            client_secret_present: !!client_secret,
            developer_token_present: !!developer_token,
            refresh_token_present: !!refresh_token,
          },
        },
        { status: 400 },
      );
    }

    const access_token = await getAccessToken({ client_id, client_secret, refresh_token });

    if (discover_only) {
      const data = await googleAdsGet({ path: 'customers:listAccessibleCustomers', developer_token, access_token });
      const resourceNames = Array.isArray(data?.resourceNames) ? data.resourceNames.map((x: any) => String(x)) : [];
      const customerIds = resourceNames
        .map((rn: string) => rn.split('/').pop() || '')
        .map(digitsOnly)
        .filter(Boolean);

      return NextResponse.json({
        validate_only: true,
        accessible_customers: {
          count: customerIds.length,
          masked: customerIds.slice(0, 25).map(maskId),
        },
      });
    }

    const customerId = digitsOnly(body?.customerId);
    const managerAccountId = hasValue(body?.managerAccountId) ? digitsOnly(body?.managerAccountId) : undefined;

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    const campaignName = 'TEST_VALIDATE_ONLY_TedsWoodworking';
    const budgetName = `Budget - ${campaignName}`;
    const budgetMicros = 5_000_000;
    const cpcBidMicros = 1_000_000;
    const adGroupName = 'General Interest';
    const keywords = ['woodworking plans'];
    const finalUrl = 'https://diy.topproductofficial.com';
    const headlines = ['Woodworking Plans Guide', 'DIY Woodworking Projects', 'Start Building Today'];
    const descriptions = ['Explore woodworking project ideas and helpful DIY guides.', 'Learn how to plan your next woodworking project.'];

    const budgetResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'campaignBudgets',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: [
        {
          create: {
            name: budgetName,
            amountMicros: budgetMicros,
            deliveryMethod: 'STANDARD',
            explicitlyShared: false,
          },
        },
      ],
    });
    const budgetResourceName = budgetResp?.results?.[0]?.resourceName || '';

    const campaignResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'campaigns',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: [
        {
          create: {
            name: campaignName,
            status: 'PAUSED',
            advertisingChannelType: 'SEARCH',
            campaignBudget: budgetResourceName,
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetPartnerSearchNetwork: false,
            targetContentNetwork: false,
            manualCpc: { enhancedCpcEnabled: false },
          },
        },
      ],
    });
    const campaignResourceName = campaignResp?.results?.[0]?.resourceName || '';

    const criteriaResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'campaignCriteria',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: [
        {
          create: {
            campaign: campaignResourceName,
            location: { geoTargetConstant: 'geoTargetConstants/2840' },
          },
        },
        {
          create: {
            campaign: campaignResourceName,
            language: { languageConstant: 'languageConstants/1000' },
          },
        },
      ],
    });

    const adGroupResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'adGroups',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: [
        {
          create: {
            name: adGroupName,
            status: 'ENABLED',
            campaign: campaignResourceName,
            type: 'SEARCH_STANDARD',
            cpcBidMicros: cpcBidMicros,
          },
        },
      ],
    });
    const adGroupResourceName = adGroupResp?.results?.[0]?.resourceName || '';

    const kwResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'adGroupCriteria',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: keywords.map((keyword) => ({
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          keyword: { text: keyword, matchType: 'PHRASE' },
        },
      })),
    });

    const adGroupId = adGroupResourceName.split('/').pop() || '';
    const adResp = await googleAdsMutate({
      customer_id: customerId,
      endpoint: 'adGroupAds',
      developer_token,
      access_token,
      login_customer_id: managerAccountId,
      validate_only: true,
      operations: [
        {
          create: {
            adGroup: `customers/${customerId}/adGroups/${adGroupId}`,
            status: 'ENABLED',
            ad: {
              finalUrls: [finalUrl],
              responsiveSearchAd: {
                headlines: headlines.map((text) => ({ text })),
                descriptions: descriptions.map((text) => ({ text })),
              },
            },
          },
        },
      ],
    });

    return NextResponse.json({
      validate_only: true,
      customer_id: maskId(customerId),
      status: 'OK',
      created_any_resource: false,
      steps: {
        budget: { ok: true, results: Array.isArray(budgetResp?.results) ? budgetResp.results.length : 0 },
        campaign: { ok: true, results: Array.isArray(campaignResp?.results) ? campaignResp.results.length : 0 },
        criteria: { ok: true, results: Array.isArray(criteriaResp?.results) ? criteriaResp.results.length : 0 },
        ad_group: { ok: true, results: Array.isArray(adGroupResp?.results) ? adGroupResp.results.length : 0 },
        keyword: { ok: true, results: Array.isArray(kwResp?.results) ? kwResp.results.length : 0 },
        rsa: { ok: true, results: Array.isArray(adResp?.results) ? adResp.results.length : 0 },
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        validate_only: true,
        status: 'ERROR',
        created_any_resource: false,
        error: e?.message || 'error',
      },
      { status: 500 },
    );
  }
}
