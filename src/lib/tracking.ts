'use client';

export const TRACKING_PARAMS = [
  'gclid', 
  'gbraid', 
  'wbraid', 
  'utm_source', 
  'utm_medium', 
  'utm_campaign', 
  'utm_content', 
  'utm_term'
];

export function captureTrackingParams(searchParams: URLSearchParams) {
  if (typeof window === 'undefined') return;
  
  TRACKING_PARAMS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      localStorage.setItem(`tracking_${key}`, value);
    }
  });
}

export function getStoredTrackingParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const params: Record<string, string> = {};
  TRACKING_PARAMS.forEach(key => {
    const value = localStorage.getItem(`tracking_${key}`);
    if (value) {
      params[key] = value;
    }
  });
  return params;
}

export function buildOutgoingUrl(baseUrl: string): string {
  if (typeof window === 'undefined') return baseUrl;
  
  try {
    const url = new URL(baseUrl);
    const storedParams = getStoredTrackingParams();
    
    Object.entries(storedParams).forEach(([key, value]) => {
      // Don't overwrite if the base URL already has it
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  } catch {
    console.error('Invalid URL:', baseUrl);
    return baseUrl;
  }
}

export function trackEvent(eventName: string, data: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    
    // Add path to all events
    const path = window.location.pathname;
    
    window.dataLayer.push({
      event: eventName,
      path: path,
      ...data
    });
  }
}

// Type augmentation for window
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
