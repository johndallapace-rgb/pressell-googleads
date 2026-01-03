import { ProductConfig } from '@/lib/config';
import { COPY_TEMPLATES } from './copyEngine';
import { LOCALIZED_INTENTS } from './i18nIntents';
import { enforceCompliance } from './verticalRules';

export interface AdCampaign {
  product: string;
  language: string;
  campaignName: string;
  adGroups: AdGroup[];
}

export interface AdGroup {
  name: string;
  keywords: string[];
  negatives: string[];
  ads: RSA[];
}

export interface RSA {
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  path1?: string;
  path2?: string;
  label?: string; // Variant A or B
}

const DEFAULT_NEGATIVES = [
  "free", "gratis", "gratuit", "kostenlos", "gratuito",
  "torrent", "download free", "crack", "hacked", "login", "member area",
  "scam", "fake", "fraud", "complaints"
];

export function generateCampaigns(product: ProductConfig): AdCampaign[] {
  const languages = ['en', 'pt', 'es', 'fr', 'it', 'de'];
  const campaigns: AdCampaign[] = [];
  
  // Determine vertical key
  const verticalKey = (product.vertical === 'health' || product.vertical === 'diy') 
    ? product.vertical 
    : 'health'; // Default to health template structure if unknown, or create a 'general' one

  // Get templates for vertical
  const templates = COPY_TEMPLATES[verticalKey] || COPY_TEMPLATES.health;

  languages.forEach(lang => {
    const langKey = lang as keyof typeof templates.headlines;
    
    // Fallback to EN if specific language template missing
    const headlinesRaw = templates.headlines[langKey] || templates.headlines['en'];
    const descriptionsRaw = templates.descriptions[langKey as keyof typeof templates.descriptions] || templates.descriptions['en'];

    // Process Headlines (Replace placeholders & Enforce Compliance)
    const processedHeadlines = headlinesRaw.map(h => 
      enforceCompliance(h.replace(/{ProductName}/g, product.name), product.vertical, 30)
    ).slice(0, 15);

    // Process Descriptions (Variant A & B)
    // Safe check for variant existence
    const descA_Raw = descriptionsRaw?.variantA || templates.descriptions['en'].variantA;
    const descB_Raw = descriptionsRaw?.variantB || templates.descriptions['en'].variantB;

    const processedDescA = descA_Raw.map(d => 
      enforceCompliance(d.replace(/{ProductName}/g, product.name), product.vertical, 90)
    ).slice(0, 4);

    const processedDescB = descB_Raw.map(d => 
      enforceCompliance(d.replace(/{ProductName}/g, product.name), product.vertical, 90)
    ).slice(0, 4);

    const campaign: AdCampaign = {
      product: product.slug,
      language: lang,
      campaignName: `[Search] [${lang.toUpperCase()}] ${product.name} - BOFU`,
      adGroups: []
    };

    // Define Intents based on localized keywords
    const intents = LOCALIZED_INTENTS[lang as keyof typeof LOCALIZED_INTENTS] || LOCALIZED_INTENTS['en'];
    
    // Create Ad Groups for core intents
    const intentKeys = ['review', 'official', 'buy', 'works']; // Core keys
    
    intentKeys.forEach(intentKey => {
      const intentWord = intents[intentKey as keyof typeof intents];
      const groupName = `${product.name} - ${intentWord}`;
      
      const adGroup: AdGroup = {
        name: groupName,
        keywords: [
          `[${product.name} ${intentWord}]`, // Exact
          `"${product.name} ${intentWord}"`, // Phrase
          `"${product.name}"` // Brand phrase fallback
        ],
        negatives: DEFAULT_NEGATIVES,
        ads: [
          {
            label: "Variant A (Social/Review)",
            headlines: processedHeadlines,
            descriptions: processedDescA,
            finalUrl: `https://${getDomainForVertical(product.vertical)}/${product.slug}`,
            path1: intents.review,
            path2: intents.legit
          },
          {
            label: "Variant B (Official/Direct)",
            headlines: processedHeadlines, // Can optimize to use different headlines too
            descriptions: processedDescB,
            finalUrl: `https://${getDomainForVertical(product.vertical)}/${product.slug}`,
            path1: intents.official,
            path2: intents.buy
          }
        ]
      };
      campaign.adGroups.push(adGroup);
    });

    campaigns.push(campaign);
  });

  return campaigns;
}

function getDomainForVertical(vertical: string): string {
  if (vertical === 'health') return 'health.topproductofficial.com';
  if (vertical === 'diy') return 'diy.topproductofficial.com';
  return 'www.topproductofficial.com';
}
