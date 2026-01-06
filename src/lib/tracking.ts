
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
  
  const separator = url.includes('?') ? '&' : '?';
  
  // Basic Tracking: External Track ID (for postback)
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
  
  return `${url}${separator}${params}`;
}
