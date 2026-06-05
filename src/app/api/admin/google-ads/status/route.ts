import { NextResponse } from 'next/server';
import { getCampaignConfig } from '@/lib/config';

export const runtime = 'nodejs';

function hasValue(v: any) {
  return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v;
}

export async function GET() {
    try {
        const config = await getCampaignConfig();

        const refreshTokenPresent = hasValue(process.env.GOOGLE_ADS_REFRESH_TOKEN) || hasValue(config.system?.api_keys?.google_ads_refresh_token);
        const developerTokenPresent = hasValue(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
        const clientIdPresent = hasValue(process.env.GOOGLE_ADS_CLIENT_ID);
        const clientSecretPresent = hasValue(process.env.GOOGLE_ADS_CLIENT_SECRET);

        const hasToken = refreshTokenPresent;

        const requiredPresent = refreshTokenPresent && developerTokenPresent && clientIdPresent && clientSecretPresent;

        const blocking_reasons: string[] = [];
        if (!refreshTokenPresent) blocking_reasons.push('missing_refresh_token');
        if (!developerTokenPresent) blocking_reasons.push('missing_developer_token');
        if (!clientIdPresent) blocking_reasons.push('missing_client_id');
        if (!clientSecretPresent) blocking_reasons.push('missing_client_secret');

        const readiness = {
            ready_for_test_real: requiredPresent,
            ready_for_production_real: false,
            blocking_reasons,
        };

        return NextResponse.json({
            status: hasToken ? 'ONLINE' : 'OFFLINE',
            hasToken,
            readiness,
        });
    } catch (e) {
        return NextResponse.json({ status: 'ERROR' }, { status: 500 });
    }
}
