import { NextResponse } from 'next/server';

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com';

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
}

function getConfig(): GoogleAdsConfig {
  const cfg = {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  };

  if (!cfg.clientId || !cfg.clientSecret || !cfg.developerToken || !cfg.refreshToken) {
    throw new Error('Missing Google Ads credentials in environment variables.');
  }

  return cfg;
}

async function getAccessToken(): Promise<string> {
  const config = getConfig();
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(GOOGLE_OAUTH_URL, {
    method: 'POST',
    body: params,
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function googleAdsRequest(
  customerId: string, 
  path: string, 
  method: 'GET' | 'POST', 
  body?: any
) {
  const accessToken = await getAccessToken();
  const config = getConfig();
  
  // Format customerId (remove dashes)
  const cleanCustomerId = customerId.replace(/-/g, '');
  
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/${path}`;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = 'Unknown Google Ads API Error';
    
    // Check if response is JSON
    try {
        const data = JSON.parse(errorText);
        errorMessage = data.error?.message || JSON.stringify(data.error) || errorMessage;
    } catch (e) {
        // Response is likely HTML (DOCTYPE) or plain text
        console.error('[GoogleAds] Non-JSON Error Response:', errorText.substring(0, 500));
        errorMessage = `Non-JSON Error (${res.status}): ${errorText.substring(0, 200)}...`;
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
     const config = getConfig();
     
     const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`;
     
     const headers = {
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
