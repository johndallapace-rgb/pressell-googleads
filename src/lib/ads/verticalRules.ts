// Compliance rules and sanitization for Google Ads
export const PROHIBITED_TERMS = {
  health: [
    "cure", "cures", "curar", "cura", "heilen", "guérir",
    "guaranteed", "garantido", "garantizado", "garantie", "garantiert",
    "miracle", "milagre", "milagro", "wunder",
    "instant weight loss", "perda de peso instantânea",
    "permanent results", "resultados permanentes",
    "cancer", "diabetes", "alzheimer", // Disease claims
    "covid", "corona"
  ],
  general: [
    "scam", "fraud", "hack", "crack", "torrent", "warez",
    "free money", "get rich quick"
  ]
};

export function sanitizeCopy(text: string, vertical: string): string {
  if (!text) return "";
  
  let cleanText = text;
  const terms = PROHIBITED_TERMS[vertical as keyof typeof PROHIBITED_TERMS] || PROHIBITED_TERMS.general;

  terms.forEach(term => {
    // Replace prohibited term with a safer alternative or remove it
    // Simple approach: case-insensitive replacement with empty string or safer synonym
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    cleanText = cleanText.replace(regex, (match) => {
      // Intelligent fallback logic could go here
      // For now, we replace strictly prohibited words with safer "Supports" or "Help" style language
      if (['cure', 'heal'].includes(match.toLowerCase())) return 'support';
      if (['guaranteed'].includes(match.toLowerCase())) return 'backed';
      return ''; 
    });
  });

  // Ensure length constraints (Headlines: 30, Descriptions: 90)
  // This is a soft check, actual truncation should happen at generation time if needed
  return cleanText.replace(/\s+/g, ' ').trim();
}

export function enforceCompliance(text: string, vertical: string, maxLength: number): string {
  let compliant = sanitizeCopy(text, vertical);
  if (compliant.length > maxLength) {
    // Basic truncation logic (better to have dedicated short variants)
    compliant = compliant.substring(0, maxLength - 3) + "...";
  }
  return compliant;
}
