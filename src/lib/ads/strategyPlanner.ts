export type Vertical = 'health' | 'diy' | 'general';
export type LocationTier = 'tier1' | 'tier2' | 'worldwide';

export interface StrategySettings {
  bidStrategy: 'Manual CPC' | 'Maximize Conversions' | 'Maximize Clicks';
  dailyBudget: number;
  cpcLimit?: number; // For Max Clicks or Manual CPC
  locations: string[];
  languages: string[];
  networks: 'Search' | 'Search + Partners';
}

export interface AdAssets {
  sitelinks: Sitelink[];
  callouts: string[];
  snippets: Snippet[];
}

interface Sitelink {
  text: string;
  desc1: string;
  desc2: string;
  urlSuffix?: string;
}

interface Snippet {
  header: string;
  values: string[];
}

export const LOCATION_TIERS = {
  tier1: ["United States", "United Kingdom", "Canada", "Australia", "New Zealand"],
  tier2: ["Germany", "France", "Italy", "Spain", "Netherlands", "Sweden", "Norway"],
  worldwide: ["United States", "United Kingdom", "Canada", "Australia", "New Zealand", "Germany", "France", "Italy", "Spain"]
};

export const STRATEGY_PRESETS: Record<Vertical, StrategySettings> = {
  health: {
    bidStrategy: 'Manual CPC',
    dailyBudget: 50,
    cpcLimit: 2.50,
    locations: LOCATION_TIERS.tier1,
    languages: ['en'],
    networks: 'Search'
  },
  diy: {
    bidStrategy: 'Maximize Clicks',
    dailyBudget: 30,
    cpcLimit: 1.50,
    locations: LOCATION_TIERS.tier1,
    languages: ['en'],
    networks: 'Search'
  },
  general: {
    bidStrategy: 'Maximize Clicks',
    dailyBudget: 20,
    cpcLimit: 1.00,
    locations: LOCATION_TIERS.tier1,
    languages: ['en'],
    networks: 'Search'
  }
};

export const ASSET_TEMPLATES: Record<Vertical, AdAssets> = {
  health: {
    sitelinks: [
      { text: "Official Site", desc1: "Get The Best Price Online.", desc2: "60-Day Money Back Guarantee.", urlSuffix: "" },
      { text: "Customer Reviews", desc1: "See Real User Results.", desc2: "Read Honest Feedback.", urlSuffix: "#reviews" },
      { text: "How It Works", desc1: "Natural Ingredients.", desc2: "Science-Backed Formula.", urlSuffix: "#how-it-works" },
      { text: "Special Offer", desc1: "Limited Time Discount.", desc2: "Save Up To 50% Today.", urlSuffix: "#pricing" }
    ],
    callouts: [
      "60-Day Guarantee", "Free Shipping", "Natural Formula", "Secure Checkout", "Made in USA", "Best Price"
    ],
    snippets: [
      { header: "Types", values: ["Capsules", "Natural", "Supplement"] },
      { header: "Service catalog", values: ["Fast Shipping", "24/7 Support", "Secure Payment"] }
    ]
  },
  diy: {
    sitelinks: [
      { text: "Download Plans", desc1: "Instant Access To PDF.", desc2: "Start Building Today.", urlSuffix: "" },
      { text: "Project List", desc1: "16,000+ Woodworking Plans.", desc2: "For All Skill Levels.", urlSuffix: "#projects" },
      { text: "Free Videos", desc1: "Watch Step-by-Step Guides.", desc2: "Learn From Pros.", urlSuffix: "#videos" },
      { text: "Lifetime Access", desc1: "One-Time Payment.", desc2: "No Monthly Fees.", urlSuffix: "#pricing" }
    ],
    callouts: [
      "Instant Access", "Printable PDFs", "Step-by-Step", "Money Back Guarantee", "16k+ Plans", "Beginner Friendly"
    ],
    snippets: [
      { header: "Types", values: ["Sheds", "Furniture", "Small Crafts", "Outdoor"] },
      { header: "Service catalog", values: ["Instant Download", "Video Guides", "Support"] }
    ]
  },
  general: {
    sitelinks: [
      { text: "Official Website", desc1: "Check Availability.", desc2: "Secure Order.", urlSuffix: "" },
      { text: "Reviews", desc1: "What People Say.", desc2: "Read Before Buying.", urlSuffix: "#reviews" }
    ],
    callouts: ["Best Value", "Top Rated", "Secure", "Fast Delivery"],
    snippets: []
  }
};

export function getStrategyRecommendation(vertical: string, language: string): { settings: StrategySettings, assets: AdAssets } {
  // Normalize vertical
  const v = (['health', 'diy'].includes(vertical) ? vertical : 'general') as Vertical;
  
  const settings = { ...STRATEGY_PRESETS[v] };
  const assets = { ...ASSET_TEMPLATES[v] };

  // Adjust for language if needed (basic mapping)
  if (language !== 'en') {
    // In a real app, we would have localized assets here.
    // For now, we keep English assets or could translate basic CTA callouts.
    settings.languages = [language];
  }

  return { settings, assets };
}

export function generateLaunchChecklist(productName: string, vertical: string): string {
  const v = vertical === 'health' ? 'Health' : 'General';
  return `
LAUNCH CHECKLIST for ${productName} (${v})
=================================================

1. TRACKING & MEASUREMENT
[ ] Google Ads Conversion Action created (Purchase/Lead)
[ ] Pixel/Tag installed on Thank You Page
[ ] Global Site Tag (gtag.js) on all pages
[ ] Conversion Linker enabled

2. COMPLIANCE (${v} Specific)
${v === 'Health' ? '[ ] Disclaimer visible on Landing Page (Medical Disclaimer)\n[ ] "Results may vary" statement present\n[ ] No "Cure" or "Miracle" claims in Copy' : '[ ] Realistic claims check'}
[ ] Privacy Policy & Terms links visible in footer
[ ] Affiliate Disclosure present and clear

3. CAMPAIGN SETTINGS
[ ] Daily Budget set (Recommended: Start low, scale up)
[ ] Location targeting verified (Exclude non-shipping countries)
[ ] Languages set correctly matches Ad Copy language
[ ] Search Network ONLY (Display/Partners disabled for higher quality start)

4. ADS & EXTENSIONS
[ ] At least 2 Responsive Search Ads (RSA) per Ad Group
[ ] Ad Strength: Good or Excellent
[ ] Sitelinks added (at least 4)
[ ] Callouts added (at least 4)
[ ] Structured Snippets added (if applicable)

5. FINAL URL CHECK
[ ] Links work and load fast
[ ] Mobile responsive check passed
[ ] /go/ link redirects correctly to affiliate offer

6. NEGATIVES
[ ] Applied "Universal Negatives" list (free, scam, crack, etc.)
[ ] Checked vertical specific negatives

READY TO LAUNCH? 
-> Set status to ENABLED
-> Monitor closely for first 24-48 hours
`.trim();
}
