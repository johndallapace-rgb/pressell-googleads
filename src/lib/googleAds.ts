import { NextResponse } from 'next/server';

import { getCampaignConfig } from '@/lib/config';

const GOOGLE_ADS_API_VERSION = 'v19';
const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com';

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
}

// In-Memory Token Cache
let tokenCache: { token: string; expiresAt: number } | null = null;

// Async function to get config (since we might need to read KV)
async function getConfig(): Promise<GoogleAdsConfig> {
  let refreshToken = '';
  try {
    const config = await getCampaignConfig();
    refreshToken =
      (typeof (config as any)?.system?.google_ads?.refresh_token === 'string'
        ? (config as any).system.google_ads.refresh_token
        : '') ||
      (typeof (config as any)?.system?.api_keys?.google_ads_refresh_token === 'string'
        ? (config as any).system.api_keys.google_ads_refresh_token
        : '');
  } catch (e) {
    console.warn('[GoogleAds] Failed to fetch config from KV', e);
  }

  if (!refreshToken) refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';

  const cfg = {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: refreshToken,
  };

  if (!cfg.clientId || !cfg.clientSecret || !cfg.developerToken || !cfg.refreshToken) {
    throw new Error('Missing Google Ads credentials (CLIENT_ID, SECRET, DEVELOPER_TOKEN, or REFRESH_TOKEN). Please connect in Admin Settings.');
  }

  return cfg;
}

// ALERT SYSTEM
async function sendAlertEmail(subject: string, message: string) {
    console.error(`[URGENT_ACTION_REQUIRED] 🚨 ${subject}`);
    console.error(`DETAILS: ${message}`);
    // TODO: Connect to Resend/SendGrid using user's API Key
    // if (process.env.RESEND_API_KEY) { ... }
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  // 1. Check Cache (if not forced)
  if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAt) {
      return tokenCache.token;
  }

  const config = await getConfig();
  
  console.log('[GoogleAds] 🔄 Refreshing Access Token...');
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });

  try {
      const res = await fetch(GOOGLE_OAUTH_URL, {
        method: 'POST',
        body: params,
      });

      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.error_description || data.error;
        // CRITICAL ALERT: Refresh Token Expired/Revoked
        if (errorMsg.includes('invalid_grant') || errorMsg.includes('unauthorized_client')) {
             await sendAlertEmail('Google Ads Token REVOKED', 'The Refresh Token is invalid. Please visit /admin/settings to reconnect Google Ads immediately.');
        }
        throw new Error(`Failed to refresh token: ${errorMsg}`);
      }

      // Cache Token (Expires in 3500s, slightly less than 3600s for safety)
      tokenCache = {
          token: data.access_token,
          expiresAt: Date.now() + 3500 * 1000 
      };

      return data.access_token;
  } catch (e: any) {
      await sendAlertEmail('Google Ads Auth Failed', e.message);
      throw e;
  }
}

async function googleAdsRequest(
  customerId: string, 
  path: string, 
  method: 'GET' | 'POST', 
  body?: any,
  retryCount = 0
): Promise<any> {
  // 1. Get Token (Silent Refresh handled internally)
  const accessToken = await getAccessToken(retryCount > 0); // Force refresh if retrying
  const config = await getConfig();
  
  // Format customerId (remove dashes)
  const cleanCustomerId = customerId.replace(/[^0-9]/g, ''); // STRICT: Only numbers
  
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/${path}`;
  
  // Log URL for debugging 404s
  // console.log(`[GoogleAds] Requesting: ${url}`);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'Content-Type': 'application/json',
    // 'login-customer-id': cleanCustomerId, // STRICTLY REMOVED as per user request for direct account
  };

  // HOTFIX: For search/mutate, if operating directly on the customer, NO login-customer-id needed
  // UNLESS accessing via Manager.
  // BUT: Some users have weird setups where they MUST use it.
  // Let's try WITHOUT first (default behavior).
  
  // If we wanted to support managers, we'd need a way to know the manager ID.
  // For now, assuming Direct Access or OAuth User = Admin of Account.

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = 'Unknown Google Ads API Error';
    let isAuthError = false;
    let isPermissionError = false;

    // Check if response is JSON
    try {
        const data = JSON.parse(errorText);
        errorMessage = data.error?.message || JSON.stringify(data.error) || errorMessage;
        
        // Detect 401/403 specifically
        if (data.error?.code === 401 || data.error?.status === 'UNAUTHENTICATED') {
            isAuthError = true;
        }
        if (data.error?.code === 403 || data.error?.status === 'PERMISSION_DENIED') {
            isPermissionError = true;
        }
    } catch (e) {
        console.error('[GoogleAds] Non-JSON Error Response:', errorText.substring(0, 500));
        errorMessage = `Non-JSON Error (${res.status}): ${errorText.substring(0, 200)}...`;
        if (res.status === 401) isAuthError = true;
    }

    // AUTO-RETRY LOGIC (Silent Recovery)
    if (isAuthError && retryCount < 1) {
        console.warn('[GoogleAds] 401 Detected. Retrying with fresh token...');
        // Recursive call with retryCount = 1, which forces token refresh
        return googleAdsRequest(customerId, path, method, body, 1);
    }

    // PERMISSION HINT
    if (isPermissionError) {
        errorMessage += ' (Hint: Verify user email matches account Admin. Try login-customer-id ONLY if Manager Account. Current config: NO login-customer-id)';
    }

    throw new Error(`Google Ads API Error: ${errorMessage}`);
  }

  return res.json();
}

export const GoogleAds = {
  /**
   * List accessible customers (Accounts)
   * Note: This uses ListAccessibleCustomers which returns resource names. 
   * Then we might need to fetch details, but for now we return the list.
   */
  async listAccessibleCustomers() {
     const accessToken = await getAccessToken();
     const config = await getConfig();
     
     const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`;
     
     const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': config.developerToken,
     };

     const res = await fetch(url, { headers });
     const data = await res.json();
     
     if (!res.ok) throw new Error(data.error?.message || 'Failed to list customers');
     
     return data.resourceNames || []; 
  },

  /**
   * Search for Campaigns in a specific Customer
   */
  async listCampaigns(customerId: string) {
    const query = `
      SELECT 
        campaign.id, 
        campaign.name, 
        campaign.status 
      FROM campaign 
      WHERE campaign.status != 'REMOVED' 
      ORDER BY campaign.name ASC
    `;

    const response = await googleAdsRequest(customerId, 'googleAds:search', 'POST', {
        query,
        pageSize: 100
    });

    return response.results?.map((row: any) => ({
        id: row.campaign.id,
        name: row.campaign.name,
        status: row.campaign.status
    })) || [];
  },

  /**
   * Search for AdGroups in a specific Campaign
   */
  async listAdGroups(customerId: string, campaignId: string) {
    const query = `
      SELECT 
        ad_group.id, 
        ad_group.name, 
        ad_group.status 
      FROM ad_group 
      WHERE 
        campaign.id = ${campaignId} 
        AND ad_group.status != 'REMOVED'
    `;

    const response = await googleAdsRequest(customerId, 'googleAds:search', 'POST', {
        query,
        pageSize: 100
    });

    return response.results?.map((row: any) => ({
        id: row.ad_group.id,
        name: row.ad_group.name,
        status: row.ad_group.status
    })) || [];
  },

  /**
   * Create a Campaign Budget
   */
  async createBudget(customerId: string, budgetName: string, amountMicros: number) {
      const operation = {
          create: {
              name: budgetName,
              amountMicros: amountMicros,
              deliveryMethod: 'STANDARD',
              explicitlyShared: false
          }
      };

      const response = await googleAdsRequest(customerId, 'campaignBudgets:mutate', 'POST', {
          operations: [operation]
      });

      return response.results?.[0]?.resourceName;
  },

  /**
   * Create a Search Campaign
   */
  async createCampaign(customerId: string, budgetResourceName: string, campaignName: string) {
      const operation = {
          create: {
              name: campaignName,
              status: 'PAUSED', // Safety first
              advertisingChannelType: 'SEARCH',
              campaignBudget: budgetResourceName,
              targetGoogleSearch: true,
              targetSearchNetwork: true,
              targetPartnerSearchNetwork: false,
              targetContentNetwork: false,
              manualCpc: {
                  enhancedCpcEnabled: false
              }
          }
      };

      const response = await googleAdsRequest(customerId, 'campaigns:mutate', 'POST', {
          operations: [operation]
      });

      return response.results?.[0]?.resourceName;
  },

  /**
   * Create an AdGroup
   */
  async createAdGroup(customerId: string, campaignResourceName: string, adGroupName: string, cpcBidMicros: number) {
      const operation = {
          create: {
              name: adGroupName,
              status: 'ENABLED',
              campaign: campaignResourceName,
              type: 'SEARCH_STANDARD',
              cpcBidMicros: cpcBidMicros
          }
      };

      const response = await googleAdsRequest(customerId, 'adGroups:mutate', 'POST', {
          operations: [operation]
      });

      return response.results?.[0]?.resourceName;
  },

  /**
   * Add Keywords to AdGroup
   */
  async addKeywords(customerId: string, adGroupResourceName: string, keywords: string[]) {
      const operations = keywords.map(keyword => ({
          create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              keyword: {
                  text: keyword,
                  matchType: 'PHRASE'
              }
          }
      }));

      const response = await googleAdsRequest(customerId, 'adGroupCriteria:mutate', 'POST', {
          operations: operations
      });

      return response.results?.map((r: any) => r.resourceName);
  },

  /**
   * Publish RSA Ad to an AdGroup
   */
  async publishAd(customerId: string, adGroupId: string, adData: {
      headlines: string[];
      descriptions: string[];
      finalUrl: string;
      path1?: string;
      path2?: string;
  }) {
      
      const adOperation = {
          create: {
              adGroup: `customers/${customerId}/adGroups/${adGroupId}`,
              status: 'ENABLED',
              ad: {
                  finalUrls: [adData.finalUrl],
                  responsiveSearchAd: {
                      headlines: adData.headlines.map(text => ({ text })),
                      descriptions: adData.descriptions.map(text => ({ text })),
                      path1: adData.path1 || undefined,
                      path2: adData.path2 || undefined
                  }
              }
          }
      };

      const response = await googleAdsRequest(customerId, 'adGroupAds:mutate', 'POST', {
          operations: [adOperation]
      });

      return response.results?.[0]?.resourceName;
  },

  /**
   * List Conversion Actions
   */
  async listConversionActions(customerId: string) {
    const query = `
      SELECT 
        conversion_action.id, 
        conversion_action.name, 
        conversion_action.type, 
        conversion_action.status 
      FROM conversion_action 
      WHERE conversion_action.status != 'REMOVED'
    `;

    const response = await googleAdsRequest(customerId, 'googleAds:search', 'POST', {
        query,
        pageSize: 100
    });

    return response.results?.map((row: any) => ({
        id: row.conversion_action.id,
        name: row.conversion_action.name,
        type: row.conversion_action.type,
        status: row.conversion_action.status
    })) || [];
  },

  /**
   * Get Campaign Metrics (Impressions, Clicks, Cost, Conversions)
   */
  async getCampaignMetrics(customerId: string) {
    // Note: We use 'segments.date DURING LAST_30_DAYS' or similar usually.
    // For simplicity, we get ALL_TIME or specific date range if provided.
    // Querying 'campaign' resource with metrics.
    
    const query = `
      SELECT 
        campaign.id, 
        campaign.name, 
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.average_cpc
      FROM campaign 
      WHERE campaign.status != 'REMOVED'
    `;

    const response = await googleAdsRequest(customerId, 'googleAds:search', 'POST', {
        query,
        pageSize: 1000
    });

    return response.results?.map((row: any) => ({
        id: row.campaign.id,
        name: row.campaign.name,
        status: row.campaign.status,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        cost: (row.metrics.cost_micros / 1000000).toFixed(2), // Convert micros to currency
        conversions: row.metrics.conversions,
        avgCpc: (row.metrics.average_cpc / 1000000).toFixed(2)
    })) || [];
  }
};
