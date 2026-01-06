
/**
 * Generates the external tracking ID for Digistore24/ClickBank
 * Format: [campaign]_[language]_[product]
 * Example: googleads_de_amino
 */
export function generateExternalTrackId(campaignSource: string, locale: string, productSlug: string): string {
  // Clean inputs
  const source = (campaignSource || 'googleads').toLowerCase().replace(/[^a-z0-9]/g, '');
  const lang = (locale || 'en').toLowerCase();
  const slug = (productSlug || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, ''); // simplified slug
  
  return `${source}_${lang}_${slug}`;
}

/**
 * Appends tracking parameters to an affiliate URL
 */
export function appendTrackingParams(url: string, trackId: string, locale?: string): string {
  if (!url) return '';
  
  let finalUrl = url;
  const isDigistore = url.includes('digistore24.com/redir/');
  
  // Digistore24 Strategy: Append Campaign Key (Tracking ID) to path
  // Standard: https://www.digistore24.com/redir/PRODUCT_ID/AFFILIATE_ID/CAMPAIGN_KEY
  if (isDigistore) {
      // Ensure we preserve the query params if they exist in the original URL
      const [baseUrl, existingQuery] = finalUrl.split('?');
      let cleanBase = baseUrl;
      
      // Remove trailing slash if present
      if (cleanBase.endsWith('/')) cleanBase = cleanBase.slice(0, -1);
      
      // Append trackId as the Campaign Key path segment
      finalUrl = `${cleanBase}/${trackId}`;
      
      // Re-attach existing query params if any
      if (existingQuery) {
          finalUrl += `?${existingQuery}`;
      }
  }

  const separator = finalUrl.includes('?') ? '&' : '?';
  
  // Basic Tracking: External Track ID (for postback & fallback)
  let params = `external_track_id=${trackId}&tid=${trackId}`;
  
  // Visual Tracking (John's Request): ?aff_sub=[COUNTRY]
  // This allows quick visual check in Digistore dashboard
  if (locale) {
      // Map locale to country code (approximate)
      // de -> DE, uk -> GB, fr -> FR
      const countryMap: Record<string, string> = {
          'de': 'DE',
          'uk': 'GB',
          'fr': 'FR',
          'it': 'IT',
          'es': 'ES',
          'us': 'US',
          'en': 'US' // default en to US usually
      };
      const country = countryMap[locale.toLowerCase()] || locale.toUpperCase();
      params += `&aff_sub=${country}`;
  }
  
  return `${finalUrl}${separator}${params}`;
}

/**
 * Builds the outgoing URL for affiliate links.
 * Currently just a pass-through, but can be enhanced for cloaking or extra params.
 */
export function buildOutgoingUrl(url: string): string {
    return url;
}

/**
 * Captures tracking parameters from the URL (e.g. gclid, utm_source)
 * and stores them (e.g. in localStorage/Cookies) for persistence.
 */
export function captureTrackingParams(searchParams: URLSearchParams | any) {
    if (!searchParams) return;
    
    // Example logic:
    // const gclid = searchParams.get('gclid');
    // if (gclid) localStorage.setItem('gclid', gclid);
    
    // For now, no-op to satisfy build.
}

type TrackEventData = {
    url?: string;
    label?: string;
    product?: string;
    variant?: string;
    lang?: string;
    [key: string]: any;
};

/**
 * Generic event tracker
 */
export function trackEvent(eventName: string, data: TrackEventData) {
    if (typeof window !== 'undefined') {
        // Console Log for Dev
        if (process.env.NODE_ENV === 'development') {
            console.log(`[TrackEvent] ${eventName}:`, data);
        }
        
        // Push to GTM / DataLayer
        const dataLayer = (window as any).dataLayer || [];
        dataLayer.push({
            event: eventName,
            ...data
        });
    }
}
